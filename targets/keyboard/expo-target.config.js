/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = () => ({
  type: 'keyboard',
  bundleIdentifier: 'com.tabsphere.keyboardlyfstyle.keyboard',
  entitlements: {
    'com.apple.security.application-groups': ['group.com.tabsphere.keyboardlyfstyle'],
  },
});
