const markdownIt = require('markdown-it')
const markdownItAttrs = require('markdown-it-attrs')
const markdownItAnchor = require('markdown-it-anchor')

const Image = require("@11ty/eleventy-img");

const EleventyPluginNavigation = require('@11ty/eleventy-navigation')
const EleventyPluginRss = require('@11ty/eleventy-plugin-rss')
const EleventyPluginSyntaxhighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const EleventyVitePlugin = require('@11ty/eleventy-plugin-vite')

const rollupPluginCritical = require('rollup-plugin-critical').default

const { resolve } = require('path')

const striptags = require('striptags')

const pluginImages = require("./eleventy.images.js");


function extractExcerpt(article) {
  if (!article.hasOwnProperty('templateContent')) {
    console.warn(
      'Failed to extract excerpt: Document has no property "templateContent".'
    )
    return null
  }

  let excerpt = null
  const content = article.templateContent

  excerpt = striptags(content)
    .substring(0, 200) // Cap at 200 characters
    .replace(/^\\s+|\\s+$|\\s+(?=\\s)/g, '')
    .trim()
    .concat('...')
  return excerpt
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginImages);
  eleventyConfig.addPlugin(EleventyPluginNavigation)
  eleventyConfig.addPlugin(EleventyPluginRss)
  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight)
  eleventyConfig.addPlugin(EleventyVitePlugin, {
    tempFolderName: '.11ty-vite', // Default name of the temp folder

    // Vite options (equal to vite.config.js inside project root)
    viteOptions: {
      publicDir: 'public',
      clearScreen: false,
      server: {
        mode: 'development',
        middlewareMode: true
      },
      appType: 'custom',
      assetsInclude: ['**/*.xml', '**/*.txt'],
      build: {
        mode: 'production',
        sourcemap: 'true',
        manifest: true,
        // This puts CSS and JS in subfolders – remove if you want all of it to be in /assets instead
        rollupOptions: {
          output: {
            assetFileNames: 'assets/css/main.[hash].css',
            chunkFileNames: 'assets/js/[name].[hash].js',
            entryFileNames: 'assets/js/[name].[hash].js'
          },
          plugins: [
            rollupPluginCritical({
              criticalUrl: './_site/',
              criticalBase: './_site/',
              criticalPages: [
                { uri: 'index.html', template: 'index' }
                // { uri: 'posts/index.html', template: 'posts/index' },
                // { uri: '404.html', template: '404' },
              ],
              criticalConfig: {
                inline: true,
                dimensions: [
                  {
                    height: 900,
                    width: 375
                  },
                  {
                    height: 720,
                    width: 1280
                  },
                  {
                    height: 1080,
                    width: 1920
                  }
                ],
                penthouse: {
                  // forceInclude: ['.fonts-loaded-1 body', '.fonts-loaded-2 body'],
                }
              }
            })
          ]
        }
      }
    }
  })

  

  // Copy/pass-through files
  eleventyConfig.addPassthroughCopy('src/assets/')

  // filters

  // Customize Markdown library settings:
  eleventyConfig.amendLibrary('md', (mdLib) => {
    mdLib.use(markdownItAttrs)

    mdLib.use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.ariaHidden({
        placement: 'after',
        class: 'header-anchor',
        assistiveText: (title) => `Permalink to "${title}`,
        // symbol:' §',
        symbol:
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16">\r\n  <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>\r\n  <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>\r\n</svg>'
        // symbol: "\uF470", // need to load bootstrap icons in js
      }),
      level: [1, 2, 3, 4],
      slugify: eleventyConfig.getFilter('slugify')
    })
  })

  // https://github.com/11ty/eleventy/issues/543#issuecomment-1005914243
  eleventyConfig.addFilter('markdownify', (str) => {
    return markdownItRenderer.render(str)
  })

  // shortcodes
  //https://dev.to/jonoyeong/excerpts-with-eleventy-4od8
  	eleventyConfig.addShortcode('excerpt', (article) => extractExcerpt(article))

  return {
    templateFormats: ['md', 'njk', 'html', 'liquid'],
    htmlTemplateEngine: 'njk',
    passthroughFileCopy: true,
    dir: {
      input: 'src',
      // better not use "public" as the name of the output folder (see above...)
      output: '_site',
      includes: '_includes',
      layouts: '_layouts',
      data: '_data'
    }
  }
}
