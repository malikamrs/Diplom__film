module.exports = {
    sourceType: "unambiguous",
    presets: [
        [
            "@babel/preset-env",
            {
                useBuiltIns: "usage",
                corejs: "3.47"
            }
        ]
    ]
};