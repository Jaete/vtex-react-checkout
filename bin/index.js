#!/usr/bin/env node

const { program } = require('commander');
const { spawn } = require('child_process');
const chalk = require('chalk');
const fs = require('fs-extra');
const prompts = require('prompts');
const path = require('path');

// Caminho da pasta template/ DENTRO do pacote npm instalado
const TEMPLATE_PATH = path.join(__dirname, '..', 'template');

program
  .name('create-vtex-checkout')
  .description('CLI para criar checkouts VTEX com React')
  .version('1.0.0')
  .action(async () => {
    const projectPath = process.cwd();

    console.log(chalk.blue.bold('\n🚀 Criando checkout VTEX...\n'));
    console.log(chalk.gray(`📂 Diretório: ${projectPath}\n`));

    if (!(await isDirectoryEmpty(projectPath))) {
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `O diretório atual não está vazio. Deseja continuar mesmo assim?`,
        initial: false,
      });

      if (!overwrite) {
        console.log(chalk.red('❌ Operação cancelada.'));
        process.exit(1);
      }
    }

    try {
      // 1. Perguntar account e workspace
      const { account, workspace } = await prompts([
        {
          type: 'text',
          name: 'account',
          message: 'Qual é o nome da account VTEX?',
          validate: (value) => value.length > 0 || 'Account é obrigatório',
        },
        {
          type: 'text',
          name: 'workspace',
          message: 'Qual é o nome do workspace?',
          validate: (value) => {
            if (value.length === 0) return 'Workspace é obrigatório';
            if (!/^[a-z0-9]+$/.test(value)) {
              return 'Workspace deve conter apenas letras minúsculas e números, sem espaços ou caracteres especiais';
            }
            return true;
          },
        },
      ]);

      if (!account || !workspace) {
        console.log(chalk.red('❌ Operação cancelada.'));
        process.exit(1);
      }

      // 2. Verificar e fazer login na account
      console.log(chalk.yellow(`\n🔐 Verificando login na account ${account}...`));
      const isLoggedIn = await checkIfLoggedIn(account);

      if (!isLoggedIn) {
        console.log(chalk.gray('   Abrindo navegador para autenticação...\n'));
        await runInteractive('vtex', ['login', account], projectPath);

        const loginSuccess = await checkIfLoggedIn(account);
        if (!loginSuccess) {
          throw new Error('Login não foi concluído. Execute "vtex login" manualmente.');
        }
        console.log(chalk.green('✅ Login realizado com sucesso!\n'));
      } else {
        console.log(chalk.green(`✅ Já está logado na account ${account}!\n`));
      }

      // 3. Mudar para o workspace
      console.log(chalk.yellow(`📂 Mudando para o workspace ${workspace}...`));
      await runInteractive('vtex', ['use', workspace], projectPath);
      console.log(chalk.green('✅ Workspace alterado com sucesso!\n'));

      // 4. Verificar e instalar checkout-ui-settings no workspace
      console.log(chalk.yellow('🔍 Verificando checkout-ui-settings no workspace...'));
      const isInstalled = await checkIfAppIsInstalled('vtex.checkout-ui-settings');

      if (!isInstalled) {
        console.log(chalk.yellow('📦 Instalando checkout-ui-settings no workspace...'));
        await runInteractive('vtex', ['install', 'vtex.checkout-ui-settings'], projectPath);
        console.log(chalk.green('✅ checkout-ui-settings instalado!\n'));
      } else {
        console.log(chalk.green('✅ checkout-ui-settings já está instalado no workspace!\n'));
      }

      // 5. Verificar se a pasta checkout-ui-settings já existe e já teve o vtex init feito (manifest.json válido)
      console.log(chalk.yellow('🔍 Verificando pasta local do checkout-ui-settings...'));
      const settingsLocalPath = path.join(projectPath, 'checkout-ui-settings');

      const alreadyInitialized = await isVtexAppInitialized(settingsLocalPath);

      if (!alreadyInitialized) {
        console.log(chalk.yellow('📦 Rodando vtex init para criar checkout-ui-settings...\n'));
        await runVtexInit(projectPath);

        console.log(chalk.yellow(`📝 Atualizando vendor do manifest.json para "${account}"...`));
        await updateManifestVendor(settingsLocalPath, account);
        console.log(chalk.green('✅ Vendor atualizado!\n'));
      } else {
        console.log(
          chalk.green(
            '✅ checkout-ui-settings já existe localmente e já possui manifest.json (vtex init já feito)!\n'
          )
        );
      }

      // 6. COPIAR template/src para checkout-ui-custom e template/claude para a raiz do projeto
      console.log(chalk.yellow('\n📂 Configurando checkout-ui-custom...'));
      await copyTemplateToCheckoutUICustom(projectPath);

      console.log(chalk.yellow('\n📂 Configurando arquivos do Claude na raiz do projeto...'));
      await copyTemplateClaudeToRoot(projectPath);

      // 7. Garantir repositório git na raiz (necessário para os hooks do husky)
      console.log(chalk.yellow('\n🔍 Verificando repositório git na raiz...'));
      await ensureGitRepo(projectPath);

      // 8. Instalar dependências npm na raiz (husky/lint-staged) e DENTRO de checkout-ui-custom
      const customPath = path.join(projectPath, 'checkout-ui-settings', 'checkout-ui-custom');
      console.log(chalk.yellow('\n📥 Instalando dependências...'));
      await runInteractive('yarn', [], projectPath);
      await runInteractive('yarn', ['install'], customPath);
      console.log(chalk.green('✅ Dependências instaladas!\n'));

      console.log(chalk.green.bold('\n✨ Checkout configurado com sucesso!\n'));
      console.log(
        chalk.gray('  # gera checkout-ui-custom/checkout6-custom.js e .css a partir de src/')
      );
      console.log(
        `  ${chalk.cyan('cd')} checkout-ui-settings/checkout-ui-custom && ${chalk.cyan('yarn')} build && cd ../..`
      );
      console.log(`  ${chalk.cyan('cd')} checkout-ui-settings`);
      console.log(`  ${chalk.cyan('vtex')} link\n`);
    } catch (error) {
      console.error(chalk.red('\n❌ Erro ao criar o checkout:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Nomes que nunca devem ser copiados do template para o projeto do usuário,
// mesmo que existam localmente em template/src ou template/claude (ex.:
// node_modules instalado à mão para rodar `tsc`/testes durante o
// desenvolvimento do próprio template, ou o bundle de build que o usuário já
// é instruído a gerar com `yarn build` — copiar um artefato stale desfaria
// esse passo).
const COPY_IGNORE_NAMES = new Set([
  'node_modules',
  '.git',
  '.DS_Store',
  'checkout6-custom.js',
  'checkout6-custom.css',
]);

function shouldCopyTemplatePath(srcPath) {
  return !COPY_IGNORE_NAMES.has(path.basename(srcPath));
}

// Copia template/src para checkout-ui-custom, apagando o conteúdo existente antes
async function copyTemplateToCheckoutUICustom(projectPath) {
  try {
    const templateSrcPath = path.join(TEMPLATE_PATH, 'src');

    if (!fs.existsSync(templateSrcPath)) {
      throw new Error(`Pasta template/src não encontrada em: ${templateSrcPath}`);
    }

    // Resolve symlinks (importante para npm link)
    const resolvedTemplateSrcPath = fs.realpathSync(templateSrcPath);

    const settingsPath = path.join(projectPath, 'checkout-ui-settings');

    if (!fs.existsSync(settingsPath)) {
      throw new Error('Pasta do checkout-ui-settings não encontrada após vtex init.');
    }

    const customPath = path.join(settingsPath, 'checkout-ui-custom');

    // Lista conteúdo do template/src
    console.log(chalk.cyan('   📋 Conteúdo do template/src:'));
    const templateContents = await fs.readdir(resolvedTemplateSrcPath);
    templateContents.forEach((item) => {
      console.log(chalk.gray(`      - ${item}`));
    });

    // Esvazia o conteúdo de checkout-ui-custom (mantendo a pasta), para substituir tudo
    console.log(chalk.yellow('\n   Limpando conteúdo de checkout-ui-custom...'));
    await fs.emptyDir(customPath);

    // Copia o conteúdo de template/src para checkout-ui-custom
    console.log(chalk.cyan('\n   Copiando template/src para checkout-ui-custom...'));
    await fs.copy(resolvedTemplateSrcPath, customPath, {
      overwrite: true,
      errorOnExist: false,
      preserveTimestamps: true,
      filter: shouldCopyTemplatePath,
    });

    console.log(chalk.green('✅ Arquivos copiados com sucesso!\n'));

    // Verifica o que foi copiado
    console.log(chalk.cyan('   📋 Conteúdo de checkout-ui-custom após a cópia:'));
    const copiedContents = await fs.readdir(customPath);
    copiedContents.forEach((item) => {
      console.log(chalk.gray(`      - ${item}`));
    });

    console.log(
      chalk.gray(`\n   📁 Total: ${copiedContents.length} arquivos/pastas em checkout-ui-custom\n`)
    );
  } catch (error) {
    throw new Error(`Erro ao configurar checkout-ui-custom: ${error.message}`);
  }
}

// Copia template/claude para a raiz do projeto, com merge de conteúdo se já existir
async function copyTemplateClaudeToRoot(projectPath) {
  try {
    const templateClaudePath = path.join(TEMPLATE_PATH, 'claude');

    if (!fs.existsSync(templateClaudePath)) {
      throw new Error(`Pasta template/claude não encontrada em: ${templateClaudePath}`);
    }

    // Resolve symlinks (importante para npm link)
    const resolvedTemplateClaudePath = fs.realpathSync(templateClaudePath);

    // Lista conteúdo do template/claude
    console.log(chalk.cyan('   📋 Conteúdo do template/claude:'));
    const templateContents = await fs.readdir(resolvedTemplateClaudePath);
    templateContents.forEach((item) => {
      console.log(chalk.gray(`      - ${item}`));
    });

    // Copia o conteúdo de template/claude para a raiz do projeto, mesclando com o que já existe
    console.log(chalk.cyan('\n   Copiando template/claude para a raiz do projeto (merge)...'));
    await fs.copy(resolvedTemplateClaudePath, projectPath, {
      overwrite: true,
      errorOnExist: false,
      preserveTimestamps: true,
      filter: shouldCopyTemplatePath,
    });

    console.log(chalk.green('✅ Arquivos copiados com sucesso!\n'));

    // Garante que o hook de pre-commit do husky continua executável após a cópia
    const preCommitHookPath = path.join(projectPath, '.husky', 'pre-commit');
    if (fs.existsSync(preCommitHookPath)) {
      await fs.chmod(preCommitHookPath, 0o755);
    }

    // settings.local.json do template traz o placeholder __PROJECT_PATH__ nos
    // caminhos absolutos das permissões (em vez do caminho da máquina de
    // quem escreveu o template) — substitui pelo diretório real do projeto
    // recém-criado.
    await rewriteProjectPathPlaceholder(projectPath);
  } catch (error) {
    throw new Error(`Erro ao configurar arquivos do Claude na raiz do projeto: ${error.message}`);
  }
}

// Substitui o placeholder __PROJECT_PATH__ pelo caminho absoluto real do
// projeto nos arquivos de configuração do Claude copiados do template.
async function rewriteProjectPathPlaceholder(projectPath) {
  const settingsPath = path.join(projectPath, '.claude', 'settings.local.json');
  if (!fs.existsSync(settingsPath)) {
    return;
  }

  const content = await fs.readFile(settingsPath, 'utf8');
  const rewritten = content.split('__PROJECT_PATH__').join(projectPath);
  await fs.writeFile(settingsPath, rewritten, 'utf8');
}

// Garante que a raiz do projeto é um repositório git (necessário para o core.hooksPath do husky)
async function ensureGitRepo(projectPath) {
  const gitPath = path.join(projectPath, '.git');

  if (fs.existsSync(gitPath)) {
    console.log(chalk.green('✅ Repositório git já existe na raiz!\n'));
    return;
  }

  console.log(chalk.yellow('📦 Inicializando repositório git na raiz...\n'));
  await runInteractive('git', ['init'], projectPath);
  console.log(chalk.green('✅ Repositório git inicializado!\n'));
}

// Função para executar comandos interativos
function runInteractive(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} falhou com código ${code}`));
    });

    child.on('error', (err) => {
      reject(new Error(`Erro ao executar ${command}: ${err.message}`));
    });
  });
}

// Função para executar comandos e capturar output
function runCapture(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout)
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    if (child.stderr)
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `${command} falhou com código ${code}`));
    });

    child.on('error', (err) => {
      reject(new Error(`Erro ao executar ${command}: ${err.message}`));
    });
  });
}

async function checkIfLoggedIn(account) {
  try {
    const { stdout } = await runCapture('vtex', ['whoami']);

    // Extrai a account do output: "Logged into ACONTA as email@..."
    const match = stdout.match(/Logged into (\S+)/);

    if (!match) {
      return false; // Não está logado
    }

    const currentAccount = match[1];

    // Compara exatamente (case-insensitive para segurança)
    return currentAccount.toLowerCase() === account.toLowerCase();
  } catch (error) {
    return false;
  }
}

async function checkIfAppIsInstalled(appName) {
  try {
    const { stdout } = await runCapture('vtex', ['list']);
    return stdout.includes(appName);
  } catch (error) {
    return false;
  }
}

async function runVtexInit(projectPath) {
  try {
    await runInteractive('vtex', ['init', 'checkout-ui-settings'], projectPath);
  } catch (error) {
    try {
      await runInteractive('vtex', ['init', '--yes'], projectPath);
    } catch (fallbackError) {
      await runInteractive('vtex', ['init'], projectPath);
    }
  }
}

// Atualiza o campo vendor do manifest.json gerado pelo vtex init
async function updateManifestVendor(dirPath, vendor) {
  const manifestPath = path.join(dirPath, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest.json não encontrado em: ${manifestPath}`);
  }

  const manifest = await fs.readJson(manifestPath);
  manifest.vendor = vendor;
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });
}

// Verifica se checkout-ui-settings já existe e já teve o vtex init feito (manifest.json válido)
async function isVtexAppInitialized(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return false;
  }

  const manifestPath = path.join(dirPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return false;
  }

  try {
    const manifest = await fs.readJson(manifestPath);
    return !!(manifest && manifest.name && manifest.vendor);
  } catch (error) {
    return false;
  }
}

async function isDirectoryEmpty(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    const visibleFiles = files.filter((f) => !f.startsWith('.'));
    return visibleFiles.length === 0;
  } catch (error) {
    return true;
  }
}

program.parse();
