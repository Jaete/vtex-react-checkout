#!/usr/bin/env node

const { program } = require('commander');
const degit = require('degit');
const { execa } = require('execa');
const chalk = require('chalk');
const fs = require('fs-extra');
const prompts = require('prompts');
const path = require('path');

// Configuração do comando principal
program
  .name('create-vtex-checkout')
  .description('CLI para criar checkouts VTEX com React')
  .version('1.0.0')
  .argument('<project-directory>', 'Nome do diretório do projeto')
  .option('-t, --template <url>', 'URL do template personalizado')
  .action(async (dir, options) => {
    const projectPath = path.resolve(dir);
    
    console.log(chalk.blue.bold('\n🚀 Criando checkout VTEX...\n'));

    // Verifica se a pasta já existe
    if (fs.existsSync(projectPath)) {
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `A pasta ${dir} já existe. Deseja sobrescrever?`,
        initial: false
      });

      if (!overwrite) {
        console.log(chalk.red('❌ Operação cancelada.'));
        process.exit(1);
      }
    }

    try {
      // 1. Clonar o boilerplate
      console.log(chalk.yellow('📦 Clonando boilerplate...'));
      const templateRepo = options.template || 'gustavokei/vtex-react-checkout';
      const emitter = degit(templateRepo, { cache: false, force: true });
      await emitter.clone(projectPath);
      console.log(chalk.green('✅ Boilerplate clonado com sucesso!\n'));

      // 2. Instalar dependências npm
      console.log(chalk.yellow('📥 Instalando dependências npm...'));
      await execa('npm', ['install'], { cwd: projectPath, stdio: 'inherit' });
      console.log(chalk.green('✅ Dependências instaladas!\n'));

      // 3. Configurar VTEX checkout-ui-custom
      console.log(chalk.yellow('🛒 Configurando VTEX checkout-ui-custom...'));
      
      // Verifica se o VTEX CLI está instalado
      try {
        await execa('vtex', ['--version'], { stdio: 'ignore' });
      } catch (e) {
        console.log(chalk.red('⚠️  VTEX CLI não encontrado. Instale com: npm install -g vtex'));
        console.log(chalk.yellow('   Pulando configuração da VTEX...\n'));
      }

      // Aqui você pode adicionar mais comandos específicos da VTEX
      // Exemplo: copiar arquivos de configuração, rodar scripts de setup, etc.

      console.log(chalk.green.bold('\n✨ Checkout criado com sucesso!\n'));
      console.log(`  ${chalk.cyan('cd')} ${dir}`);
      console.log(`  ${chalk.cyan('npm')} run dev\n`);
      
    } catch (error) {
      console.error(chalk.red('\n❌ Erro ao criar o checkout:'));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program.parse();