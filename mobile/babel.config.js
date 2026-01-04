module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@stores": "./src/stores",
            "@services": "./src/services",
            "@utils": "./src/utils",
            "@types": "./src/types",
            "@constants": "./src/constants",
            "@hooks": "./src/hooks",
          },
        },
      ],
    ],
  };
};
