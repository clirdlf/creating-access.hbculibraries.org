const path = require('path');
const { resolve } = require('path')
// markdownit additions
const markdownIt = require('markdown-it')
const markdownItAttrs = require('markdown-it-attrs')
const markdownItAnchor = require('markdown-it-anchor')
const implicitFigures = require('markdown-it-implicit-figures');

const striptags = require('striptags')

const EleventyPluginNavigation = require('@11ty/eleventy-navigation')
const EleventyPluginRss = require('@11ty/eleventy-plugin-rss')
const EleventyVitePlugin = require("@11ty/eleventy-plugin-vite");

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

module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("src/assets/");

    eleventyConfig.addPlugin(pluginImages);
    eleventyConfig.addPlugin(EleventyPluginNavigation)
    eleventyConfig.addPlugin(EleventyPluginRss)

    eleventyConfig.addPlugin(EleventyVitePlugin, {
      tempFolderName: ".11ty-vite", // Default name of the temp folder

      root: path.resolve(__dirname, "src"),
  
      // Options passed to the Eleventy Dev Server
      // e.g. domdiff, enabled, etc.
  
      // Added in Vite plugin v2.0.0
      serverOptions: {},
  
      // Defaults are shown:
      viteOptions: {
        clearScreen: false,
        appType: "mpa", // New in v2.0.0
        assetsInclude: ['**/*.xml', '**/*.txt'],
        
        server: {
          mode: "development",
          middlewareMode: true,
        },
  
        build: {
          mode: "production",
        },
  
        // New in v2.0.0
        resolve: {
          alias: {
            // Allow references to `node_modules` folder directly
            "/node_modules": path.resolve(".", "node_modules"),
            "~bootstrap": path.resolve(__dirname, "node_modules/bootstrap"),
          },
        },
      },
    });

    // filters
  eleventyConfig.addFilter("head", (array, n) => {
		if(!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if( n < 0 ) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

  // Customize Markdown library settings:
  eleventyConfig.amendLibrary('md', (mdLib) => {
    mdLib.use(markdownItAttrs)

    mdLib.use(implicitFigures, {
      figcaption: true,  // <figcaption>alternative text</figcaption>, default: false
      lazyLoading: true,
      copyAttrs: false
    })

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
        dir: {
          input: "src",
          output: "_site",
          includes: "_includes", // this path is releative to input-path (src/)
          layouts: "_layouts", // this path is releative to input-path (src/)
          data: "_data", // this path is releative to input-path (src/)
        },
        templateFormats: ["njk", "md"],
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk",
        // important for github pages build (subdirectory):
        pathPrefix: '/creating-access.hbculibraries.org'
      };
};