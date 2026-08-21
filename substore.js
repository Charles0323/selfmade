// 1. 动态捕获当前 Sub-Store 文件流的文本内容
let rawText = typeof $content !== 'undefined' ? $content : (typeof $files !== 'undefined' ? $files[0] : null);

if (rawText) {
  try {
    // 2. 解析 YAML 配置文件为 JS 对象
    const yamlObj = ProxyUtils.yaml.safeLoad(rawText);

    // 3. 显式声明我们要针对的分组，并将 PROXY 牢牢锁定在数组的第一项
    const patches = {
      "AIGC": ["PROXY", "SG AUTO", "JP AUTO", "US AUTO"],
      "Telegram": ["PROXY", "HK AUTO", "SG AUTO", "JP AUTO", "US AUTO"],
      "Google": ["PROXY", "HK AUTO", "SG AUTO", "JP AUTO", "US AUTO"]
    };

    // 4. 精准遍历并修改对应的策略组
    if (yamlObj && yamlObj['proxy-groups']) {
      yamlObj['proxy-groups'].forEach(group => {
        if (patches[group.name]) {
          group.proxies = patches[group.name];
          console.log(`[Custom] 成功将 PROXY 提升至分组首位: ${group.name}`);
        }
      });
    }

    // 5. 动态补充声明一个 steam_cn 的 rule-provider (防止你原本的配置里没有)
    if (yamlObj) {
      if (!yamlObj['rule-providers']) {
        yamlObj['rule-providers'] = {};
      }
      // 注入 SteamCN（中国/下载服务）的规则集源
      yamlObj['rule-providers']['steam_cn'] = {
        type: "http",
        behavior: "classical",
        format: "yaml",
        url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/SteamCN/SteamCN.yaml",
        path: "./ruleset/steamcn.yaml",
        interval: 86400
      };
      // 确保你的配置里一定有全球 steam 规则集
      yamlObj['rule-providers']['steam'] = {
        type: "http",
        behavior: "classical",
        format: "yaml",
        url: "https://testingcf.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Steam/Steam.yaml",
        path: "./ruleset/steam.yaml",
        interval: 86400
      };
    }

    // 6. 动态注入你提供的一大波新分流规则，并加上 Steam 分流规则
    if (yamlObj) {
      if (!yamlObj['rules']) {
        yamlObj['rules'] = [];
      }
      
      // 准备好你的本地硬编码规则
      const myNewRules = [
        "DOMAIN-SUFFIX,baidu.com,DIRECT",
        "DOMAIN-SUFFIX,bing.cn,DIRECT",
        "DOMAIN-SUFFIX,tencent.com,DIRECT",
        "DOMAIN-SUFFIX,903030.xyz,DIRECT",
        "DOMAIN-SUFFIX,m-team.cc,DIRECT",
        "DOMAIN-SUFFIX,hdfans.org,DIRECT",
        "DOMAIN-SUFFIX,blizzard.cn,DIRECT",
        "DOMAIN-SUFFIX,javcdn.cc,PROXY",
        "DOMAIN-SUFFIX,github.com,PROXY",
        "DOMAIN-KEYWORD,m-team,DIRECT",
        "DOMAIN-KEYWORD,xsijishe,PROXY",
        "DOMAIN-KEYWORD,sjs,PROXY",
        "DOMAIN-KEYWORD,urlimage,PROXY",
        "DOMAIN-KEYWORD,javcdn,PROXY",
        "DOMAIN-KEYWORD,javbus,PROXY",
        "DOMAIN-SUFFIX,xiunice.com,PROXY"
      ];

      // 核心补充：让规则集生效的代码（置顶）
      const steamRules = [
        "RULE-SET,steam_cn,DIRECT", // Steam 中国和下载：强制直连
        "RULE-SET,steam,PROXY"      // Steam 社区、商店、全球服务：走 PROXY 策略组
      ];

      // 将本地规则与 Steam 规则合并，整体塞到最顶端
      const finalTopRules = [...myNewRules, ...steamRules];
      yamlObj['rules'].unshift(...finalTopRules);
      console.log('[Custom] 成功批量注入本地规则与 Steam 规则集分流规则');
    }

    // 7. 将修改完毕的对象重新组合成标准的 YAML 文本并写回系统
    $content = ProxyUtils.yaml.dump(yamlObj);

  } catch (e) {
    console.log('[Custom] 脚本执行发生错误: ' + e.message);
  }
}
