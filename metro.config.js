const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// @digitech/hermes-chat-native is consumed via a `file:` dependency, which npm
// installs as a symlink into node_modules pointing at its real location
// outside this project (../../assistanceu/packages/hermes-chat-native).
// Metro doesn't watch or resolve outside its project root by default, so the
// symlink target needs to be added to watchFolders, and symlink-aware
// resolution needs to be turned on so Metro resolves react/react-native from
// this project's node_modules rather than from any (nonexistent) copy inside
// the linked package.
const hermesChatNativeDir = path.resolve(
  __dirname,
  "../../assistanceu/packages/hermes-chat-native"
);

config.watchFolders = [...(config.watchFolders || []), hermesChatNativeDir];
config.resolver.unstable_enableSymlinks = true;

// hermes-chat-native has no react/react-native/etc. of its own (they're peer
// deps, resolved by whichever app installs it) -- so when Metro resolves
// bare imports from inside it, it needs to be told to use this project's
// copies instead of walking up from the package's real (out-of-project)
// directory, where none exist.
const sharedPeerDependencies = [
  "react",
  "react-native",
  "@ai-sdk/react",
  "ai",
  "@expo/vector-icons",
  "expo-image-picker",
  "expo-document-picker",
  "expo-file-system",
  "expo-modules-core",
  "@babel/runtime",
];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...Object.fromEntries(
    sharedPeerDependencies.map((name) => [
      name,
      path.join(__dirname, "node_modules", name),
    ])
  ),
};

module.exports = withNativeWind(config, { input: "./global.css" });
