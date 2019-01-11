//退出

function quitClick() {
    if (loginInfo.identifier) {
        //sdk登出
        webim.logout(
            function(resp) {
                loginInfo.identifier = null;
                loginInfo.userSig = null;
                document.getElementById("webim_demo").style.display = "none";
                var indexUrl = window.location.href;
                var pos = indexUrl.indexOf('?');
                if (pos >= 0) {
                    indexUrl = indexUrl.substring(0, pos);
                }
                window.location.href;
            }
        );
    } else {
        alert('未登录');
    }
}

//被新实例踢下线的回调处理

function onKickedEventCall() {
    webim.Log.error("其他地方登录，被T了");
    alert('被T,如有需要请刷新重新登录。');
    //document.getElementById("webim_demo").style.display = "none";
    webim.login(
        loginInfo, listeners, options,
        function(resp) {
            loginInfo.identifierNick = resp.identifierNick; //设置当前用户昵称
            loginInfo.headurl = resp.headurl;
            initDemoApp();
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );
}

//退出

function quitClick_yqq() {
    if (loginInfo.identifier) {
        //sdk登出
        webim.logout(
            function(resp) {
                loginInfo.identifier = null;
                loginInfo.userSig = null;
                TLSHelper.goLogin({
                    sdkappid: loginInfo.sdkAppID,
                    acctype: loginInfo.accountType,
                    url: window.location.href
                });
            }
        );
    } else {
        alert('未登录');
    }
}