// 1. 动态捕获当前 Sub-Store 文件流的文本内容
let rawText = typeof $content !== 'undefined' ? $content : (typeof $files !== 'undefined' ? $files[0] : null);

if (rawText) {
  try {
    // 2. 使用 Sub-Store 官方内置工具库解析 YAML 配置文件为 JS 对象
    const yamlObj = ProxyUtils.yaml.safeLoad(rawText);

    // 3. 显式声明我们要针对的分组，并将 PROXY 牢牢锁定在数组的第一项（最前面）
    const patches = {
      "AIGC": ["PROXY", "SG AUTO", "JP AUTO", "US AUTO"],
      "Telegram": ["PROXY", "HK AUTO", "SG AUTO", "JP AUTO", "US AUTO"],
      "Google": ["PROXY", "HK AUTO", "SG AUTO", "JP AUTO", "US AUTO"]
    };

    // 4. 精准遍历并修改对应的策略组
    if (yamlObj && yamlObj['proxy-groups']) {
      yamlObj['proxy-groups'].forEach(group => {
        if (patches[group.name]) {
          // 用新配置覆盖旧配置，PROXY 成功插到了最前面
          group.proxies = patches[group.name];
          console.log(`[Custom] 成功将 PROXY 提升至分组首位: ${group.name}`);
        }
      });
    }

    // 5. 动态注入你提供的一大波新分流规则到 rules 顶端
    if (yamlObj) {
      if (!yamlObj['rules']) {
        yamlObj['rules'] = [];
      }
      
      // 准备好你给的所有规则（按顺序排列）
      const myNewRules = [
        "DOMAIN-SUFFIX,baidu.com,DIRECT",
        "DOMAIN-SUFFIX,bing.cn,DIRECT",
        "DOMAIN-SUFFIX,tencent.com,DIRECT",
        "DOMAIN-SUFFIX,linux.do,DIRECT",
        "DOMAIN-SUFFIX,903030.xyz,DIRECT",
        "DOMAIN-SUFFIX,m-team.cc,DIRECT",
        "DOMAIN-SUFFIX,javcdn.cc,PROXY",
        "DOMAIN-KEYWORD,m-team,DIRECT",
        "DOMAIN-KEYWORD,xsijishe,PROXY",
        "DOMAIN-KEYWORD,sjs47,PROXY",
        "DOMAIN-KEYWORD,urlimage,PROXY",
        "DOMAIN-KEYWORD,javcdn,PROXY",
        "DOMAIN-KEYWORD,javbus,PROXY"
      ];

      // 使用 unshift.apply 或者是扩展运算符，把这些规则整体“怼”到 Clash 原有规则的最上面
      yamlObj['rules'].unshift(...myNewRules);
      console.log('[Custom] 成功批量注入自定义分流规则');
    }

    // 6. 将修改完毕的对象重新组合成标准的 YAML 文本并写回系统
    $content = ProxyUtils.yaml.dump(yamlObj);

  } catch (e) {
    console.log('[Custom] 脚本执行发生错误: ' + e.message);
  }
}
