# CleanUnusedFilesPlugin
清理无用文件, 适用于@vue/cli  5

## 用法

```js
module.exports = {
  configureWebpack: {
    plugins: [
      new CleanUnusedFilesPlugin({
        // 配置选项
        root: 'src',
        clean: false, // 根据需要设置为true以实际删除文件
        output: path.resolve(__dirname, 'unused-files-report.json'),
        exclude: ['public/images'] // 排除的文件或目录
      })
    ]
  }
}
```
