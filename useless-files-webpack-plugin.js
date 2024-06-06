const fs = require('fs')
const glob = require('glob')
const path = require('path')

class CleanUnusedFilesPlugin {
  constructor(options) {
    this.opts = options
  }
  apply(compiler) {
    const afterEmitHook = compiler.hooks.afterEmit;
    afterEmitHook.tapAsync('CleanUnusedFilesPlugin', (compilation, done) => {
      this.findUnusedFiles(compilation, this.opts).then(() => {
        done();
      }).catch(err => {
        done(err);
      });
    });
  }

  /**
   * 获取依赖的文件
   */
  getDependFiles(compilation) {
    return new Promise((resolve, reject) => {
      const dependedFiles = [...compilation.fileDependencies].reduce(
        (acc, usedFilepath) => {
          if (!~usedFilepath.indexOf('node_modules')) {
            acc.push(usedFilepath)
          }
          return acc
        },
        []
      )
      resolve(dependedFiles)
    })
  }

  /**
   * 获取项目目录所有的文件
   */
  getAllFiles(pattern) {
    return new Promise((resolve, reject) => {
      glob(
        pattern,
        {
          nodir: true
        },
        (err, files) => {
          if (err) {
            throw err
          }
          const out = files.map(item => path.resolve(item))
          resolve(out)
        }
      )
    })
  }

  async dealExclude(subPath, unusedList, rootPath) {
    const pattern = path.join(rootPath, subPath, '/**/*')
    const files = await this.getAllFiles(pattern)
    const result = unusedList.filter(unused => {
      return !files.includes(unused)
    })
    return result
  }

  async findUnusedFiles(compilation, config = {}) {
    const {
      root = './src',
      clean = false,
      output = './unused-files.json',
      exclude = false
    } = config
    const pattern = root + '/**/*'
    try {
      const allChunks = await this.getDependFiles(compilation)
      const allFiles = await this.getAllFiles(pattern)
      let unUsed = allFiles.filter(item => !~allChunks.indexOf(item))
      if (exclude) {
        if (typeof exclude === 'string') {
          unUsed = await this.dealExclude(exclude, unUsed, root)
        }
        if (exclude instanceof Array) {
          for (let value of exclude) {
            unUsed = await this.dealExclude(value, unUsed, root)
          }
        }
      }
      if (typeof output === 'string') {
        fs.writeFileSync(output, JSON.stringify(unUsed, null, 4))
      } else if (typeof output === 'function') {
        output(unUsed)
      }
      if (clean) {
        unUsed.forEach(file => {
          fs.rmSync(file)
          console.log(`remove file: ${file}`)
        })
      }
      return unUsed
    } catch (err) {
      throw err
    }
  }
}

module.exports = CleanUnusedFilesPlugin
