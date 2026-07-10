const webpack = require('webpack')
const path = require('path')
const outputDir = './'
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const RemovePlugin = require('remove-files-webpack-plugin')
const svgToMiniDataURI = require('mini-svg-data-uri')
const TerserPlugin = require('terser-webpack-plugin')

// Injeta um trecho de CSS sempre no TOPO do arquivo .css final, antes de
// qualquer coisa vinda do grafo de módulos (SCSS/CSS Modules dos
// componentes). Existe pra resolver um problema específico: um reset
// baseado em seletor universal (ex.: `.vtex-cart-app *`) tem a MESMA
// especificidade de qualquer classe simples (ex.: `.card`), então quem
// vier depois no arquivo ganha o empate. Se esse reset estivesse dentro de
// um *.module.scss, a posição dele no CSS final dependeria da ordem de
// import dos componentes React (frágil, e já causou um bug real: padding
// zerado em todos os cards do carrinho). Injetando aqui, a posição é
// garantida pelo webpack, independente de qualquer refactor futuro no
// grafo de componentes.
class InjectGlobalResetPlugin {
  constructor(css) {
    this.css = css
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('InjectGlobalResetPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'InjectGlobalResetPlugin',
          // Roda ANTES do estágio de minificação (CssMinimizerPlugin), para
          // que este CSS também seja validado/minificado junto com o resto.
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        (assets) => {
          const cssAssetName = Object.keys(assets).find((name) => name.endsWith('.css'))
          if (!cssAssetName) return

          const { sources } = compiler.webpack
          const existingSource = compilation.getAsset(cssAssetName).source
          compilation.updateAsset(cssAssetName, new sources.ConcatSource(this.css, '\n', existingSource))
        },
      )
    })
  }
}

// Fonte única deste reset — não duplicar em nenhum *.module.scss.
// Escopo: só dentro de `.vtex-cart-app` (classe literal aplicada no root
// do componente Cart, ver Cart.tsx).
const GLOBAL_RESET_CSS =
  '.vtex-cart-app *,.vtex-cart-app :before,.vtex-cart-app :after{box-sizing:border-box;margin:0;padding:0}'

// Carimba o MESMO "Integrity Hash" no topo do .js E do .css a cada
// compilação, usando o `compilation.hash` (fullhash único desta build,
// idêntico para todos os assets por definição).
//
// Por que NÃO o BannerPlugin com `[fullhash]`: o BannerPlugin resolve o
// placeholder por-asset via `compilation.getPath`, e o CSS extraído pelo
// MiniCssExtractPlugin cai em outro contexto de hash — resultado, o mesmo
// build emitia hashes DIFERENTES no .js e no .css (verificado: 424cd4d... no
// JS vs 4f29341... no CSS). O template do checkout usa esse valor pra casar
// o par .js/.css do mesmo build; hashes divergentes fazem o CSS ser
// rejeitado, quebrando o estilo — inclusive nos hot reloads do `yarn dev`.
// Aqui um único valor é escrito nos dois, sempre juntos, numa passada só.
class InjectIntegrityBannerPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('InjectIntegrityBannerPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'InjectIntegrityBannerPlugin',
          // Depois da minificação (Terser/CssMinimizer rodam em OPTIMIZE_SIZE):
          // garante o banner no topo dos dois arquivos e que nada o remova.
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
        },
        (assets) => {
          const { sources } = compiler.webpack
          // `/*! ... @preserve */` é comentário válido em JS e CSS.
          const banner = `/*! @preserve Integrity Hash: ${compilation.hash} */\n`
          Object.keys(assets)
            .filter((name) => /\.(js|css)$/.test(name))
            .forEach((name) => {
              const existingSource = compilation.getAsset(name).source
              compilation.updateAsset(name, new sources.ConcatSource(banner, existingSource))
            })
        },
      )
    })
  }
}

module.exports = (_env, argv) => {
  // argv.mode é o valor literal passado em `--mode` na CLI (yarn dev usa
  // --mode=development, yarn build usa --mode=production). Não usamos isso
  // pra mudar o `mode` do webpack em si — o build É sempre minificado,
  // de propósito (ver comentário em optimization.minimize) — só pra decidir
  // o formato do nome das classes do CSS Modules abaixo.
  const isProductionBuild = argv.mode !== 'development'

  return [
    {
      mode: 'production',
      entry: {
        'checkout6-custom': [
          './src/checkout6-custom.scss',
          './src/checkout6-custom.tsx',
        ],
      },
      output: {
        filename: '[name].js',
        path: path.resolve(__dirname, outputDir),
        // Reescreve SEMPRE os dois assets (checkout6-custom.js E .css) a cada
        // compilação — inclusive em watch (`yarn dev`), quando só o TSX ou só
        // o SCSS mudou. O padrão do webpack (`true`) pula gravar um asset cujos
        // bytes não mudaram, o que faria o .js e o .css saírem de sincronia.
        // Como TSX e SCSS compartilham o mesmo entrypoint, qualquer alteração
        // recompila os dois juntos; isto garante que os dois também sejam
        // regravados juntos no disco.
        compareBeforeEmit: false,
      },
      externals: {
        // Apenas libs que já existem no ambiente do checkout VTEX
        jquery: 'jQuery',
      },
      optimization: {
        // Sempre minificar — vtex link envia o arquivo inteiro,
        // e o .vtexignore já exclui *.map (source maps externos)
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
                // Otimizações extras de compressão
                passes: 2,
                pure_getters: true,
              },
              format: {
                comments: /@preserve/i,
              },
              mangle: {
                safari10: true,
              },
            },
            extractComments: false,
          }),
          new CssMinimizerPlugin(),
        ],
        // ⚠️ SEM splitChunks — VTEX só carrega checkout6-custom.js
        // Separar em chunks quebraria o carregamento no checkout
        usedExports: true,
        concatenateModules: true,
        sideEffects: true,
      },
      plugins: [
        new ForkTsCheckerWebpackPlugin(),
        new MiniCssExtractPlugin({
          filename: '[name].css',
          chunkFilename: '[id].css',
        }),
        new InjectGlobalResetPlugin(GLOBAL_RESET_CSS),
        new RemovePlugin({
          before: {
            test: [
              {
                folder: './',
                method: (item) => {
                  return /checkout6-custom\.(js|css)(\.map)?$/.test(item);
                },
              },
            ],
          },
        }),
        new InjectIntegrityBannerPlugin(),
      ],
      module: {
        rules: [
          {
            test: /\.(js|jsx|ts|tsx)$/,
            exclude: /node_modules/,
            use: [
              {
                loader: 'babel-loader',
                options: {
                  cacheDirectory: true,
                  presets: [
                    ['@babel/preset-env', {
                      targets: '> 0.25%, not dead',
                      // Evita polyfills desnecessários
                      useBuiltIns: false,
                    }],
                    '@babel/preset-typescript',
                    ['@babel/preset-react', {
                      // Usa o JSX transform novo (React 17+) — não precisa de "import React"
                      // e gera código menor
                      runtime: 'automatic',
                    }],
                  ],
                  plugins: [
                    '@babel/plugin-proposal-optional-chaining',
                    '@babel/plugin-proposal-nullish-coalescing-operator',
                  ],
                },
              },
            ],
          },
          {
            test: /\.(scss|css)$/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader,
                options: { publicPath: '' },
              },
              {
                loader: 'css-loader',
                options: {
                  url: true,
                  modules: {
                    // auto: true → só aplica CSS Modules a *.module.scss,
                    // igual ao comportamento padrão do css-loader.
                    auto: true,
                    // Em dev (yarn dev, --mode=development): nome legível
                    // pra debugar no devtools — "title" de Header.module.scss
                    // vira "Header-module__title--a1b2c" em vez de um hash
                    // puro. Em build de produção real (yarn build): só o
                    // hash, sem o prefixo com nome de arquivo/classe — não
                    // expõe a estrutura interna dos componentes no CSS
                    // público e o arquivo final fica menor.
                    localIdentName: isProductionBuild ? '[hash:base64:6]' : '[name]__[local]--[hash:base64:5]',
                  },
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    presets: ['postcss-preset-env'],
                    plugins: ['autoprefixer', 'cssnano'],
                  },
                },
              },
              'sass-loader',
            ],
          },
          {
            test: /\.svg/,
            type: 'asset/inline',
            parser: {
              dataUrlCondition: { maxSize: 30 * 1024 },
            },
            generator: {
              dataUrl: (content) => svgToMiniDataURI(content.toString()),
            },
          },
        ],
      },
      resolve: {
        preferRelative: true,
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        // Aliases para os diretórios cross-boundary (importados de vários
        // pontos da árvore). Devem espelhar exatamente `paths` no tsconfig.json.
        alias: {
          '~components': path.resolve(__dirname, 'src', 'components'),
          '~hooks': path.resolve(__dirname, 'src', 'hooks'),
          '~utils': path.resolve(__dirname, 'src', 'utils'),
        },
      },
      performance: {
        hints: 'warning',
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
      },
      // Sem source maps — não são úteis no ambiente VTEX
      // e inflam o payload do vtex link
      devtool: false,
    },
  ]
}

