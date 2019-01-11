//初始化demo

function initDemoApp() {
    $(".msg").show(); //展开聊天界面
    document.getElementById("userImg").src = loginInfo.headurl;
    document.getElementById("userID").innerHTML = webim.Tool.formatText2Html(loginInfo.identifier);
    if (loginInfo.identifierNick) {
        document.getElementById("t_my_name").innerHTML = webim.Tool.formatText2Html(loginInfo.identifierNick);
    } else {
        document.getElementById("t_my_name").innerHTML = webim.Tool.formatText2Html(loginInfo.identifier);
    }

    //读取会话列表
    initInfoList();

    //获取最近联系人
    getRecentListDate()
}

//获取用户与群组资料

function initInfoList() {
    var options = {
        'From_Account': loginInfo.identifier,
        'TimeStamp': 0,
        'StartIndex': 0,
        'GetCount': 100,
        'LastStandardSequence': 0,
        "TagList": [
            "Tag_Profile_IM_Nick",
            "Tag_Profile_IM_Image"
        ]
    };

    webim.getAllFriend(
        options,
        function(resp) {
            if (resp.FriendNum > 0) {

                var friends = resp.InfoItem;
                if (!friends || friends.length == 0) {
                    if (cbOK)
                        cbOK();
                    return;
                }
                var count = friends.length;

                for (var i = 0; i < count; i++) {
                    var friend = friends[i];
                    var friend_account = friend.Info_Account;
                    var friend_name = friend_image = '';
                    for (var j in friend.SnsProfileItem) {
                        switch (friend.SnsProfileItem[j].Tag) {
                            case 'Tag_Profile_IM_Nick':
                                friend_name = friend.SnsProfileItem[j].Value;
                                break;
                            case 'Tag_Profile_IM_Image':
                                friend_image = friend.SnsProfileItem[j].Value;
                                break;
                        }
                    }
                    infoMap.push({
                        'name': friend_name,
                        'image': friend_image,
                        'id': friend_account,
                        'type': "C2C"
                    })
                }
            }

            friendList(resp.InfoItem);
            chioceFriend(resp.InfoItem);

        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );

    var optionsG = {
        'Member_Account': loginInfo.identifier,
        'Limit': 10,
        'Offset': 0,
        'GroupBaseInfoFilter': [
            'Name',
            'FaceUrl'
        ]
    };
    webim.getJoinedGroupListHigh(
        optionsG,
        function(resp) {
            if (resp.GroupIdList && resp.GroupIdList.length) {
                for (var i = 0; i < resp.GroupIdList.length; i++) {
                    var group_account = resp.GroupIdList[i].GroupId;
                    var group_name = resp.GroupIdList[i].Name;
                    var group_image = resp.GroupIdList[i].FaceUrl;

                    infoMap.push({
                        'name': group_name,
                        'image': group_image,
                        'id': group_account,
                        'type': 'GROUP'
                    })
                }
            }
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );
}

//最近联系人

function getRecentListDate() {
    webim.getRecentContactList({
        'Count': 100 //最近的会话数 ,最大为100
    }, function(resp) {
        for (var i = 0; i < resp.SessionItem.length; i++) {
            for (var j = 0; j < infoMap.length; j++) {
                if ((resp.SessionItem[i].To_Account == infoMap[j].id) || (resp.SessionItem[i].ToAccount == infoMap[j].id)) {
                    resp.SessionItem[i].userName = infoMap[j].name;
                    resp.SessionItem[i].userUrl = infoMap[j].image;
                    resp.SessionItem[i].msgType = infoMap[j].type;
                    resp.SessionItem[i].userId = infoMap[j].id;
                }
            }
        }
        webim.syncMsgs(initUnreadMsgCount); //初始化最近会话的消息未读数
        getRecentContacts(resp.SessionItem);
    }, function(resp) {
        console.info('最近联系人获取失败');
    });
}

//更新未读计数

function updateSessDiv(to_id, unread_msg_count) {
    if (unread_msg_count > 0) {
        if (unread_msg_count >= 100) {
            unread_msg_count = '99+';
        }
        for (var i = 0; i < $('.unread').length; i++) {
            if ($($('.unread')[i]).parent('.msg_li').attr('friendid') == to_id) {
                $($('.unread')[i]).show();
                $($('.unread')[i]).text(unread_msg_count);
            }
        }
    } else if (unread_msg_count == 0) {
        for (var i = 0; i < $('.unread').length; i++) {
            if ($($('.unread')[i]).parent('.msg_li').attr('friendid') == to_id) {
                $($('.unread')[i]).hide();
            }
        }
    }
}

//会话列表展示

function getRecentContacts(data) {
    if (data.length >= 0) {
        var sessDiv = document.getElementById("msg");
        $($(".bottom").find('li')[0]).addClass('greeColor');
        for (var i = 0; i < data.length; i++) {
            var faceImg = document.createElement("img");
            faceImg.className = "msg_li_img";
            if (data[i].userUrl != '' && data[i].userUrl != undefined) {
                faceImg.src = data[i].userUrl;
            } else {
                faceImg.src = 'img/me.jpg'
            }
            var nameLi = document.createElement("li");
            nameLi.className = "msg_li";
            var content = document.createElement("div");
            content.className = 'disIn';
            if ((data[i].userName != undefined) && (data[i].userId != undefined)) {
                if (data[i].userName != '') {
                    content.innerHTML = "<span class='userName'>" + data[i].userName + "</span>";
                } else if (data[i].userId != '') {
                    content.innerHTML = "<span class='userName'>" + data[i].userId + "</span>";
                }
                nameLi.setAttribute("friendId", data[i].userId);
                nameLi.setAttribute("msgType", data[i].msgType);
            } else {
                nameLi.setAttribute("friendId", data[i].To_Account);
                nameLi.setAttribute("msgType", 'C2C');
                content.innerHTML = "<span class='userName'>" + data[i].To_Account + "</span>";
            }
            var timeSpan = document.createElement("span");
            timeSpan.className = "msg_li_time";
            timeSpan.innerHTML = new Date(parseInt(data[i].MsgTimeStamp) * 1000).toLocaleString().substr(0, 9);
            var unread = document.createElement("span");
            unread.className = 'unread';
            nameLi.onclick = function() {
                msgList($(this).attr("friendId"), $(this).attr("msgType"))
            }
            nameLi.appendChild(faceImg);
            nameLi.appendChild(content);
            nameLi.appendChild(unread);
            nameLi.appendChild(timeSpan);
            sessDiv.appendChild(nameLi);
        }
        for (var j = 0; j < data.length; j++) {
            if (data[j].UnreadMsgCount > 0) {
                updateSessDiv(data[j].userId, data[j].UnreadMsgCount)
            }
        }
    } else {
        alert('会话列表为空。');
    }
}

//获取会话消息
var msgShowID;
var msgSendId;
var selType;
var masSendUrl;

function msgList(id, type) {

    $('.conetet').hide();
    $('.msg').hide();
    $('.msgShow').show();
    $('.moreList').hide();
    $('.friend_list_more').remove();
    for (var i = 0; i < infoMap.length; i++) {
        if (id == infoMap[i].id) {
            msgShowID = infoMap[i].name;
            msgSendId = id;
            masSendUrl = infoMap[i].image;
        } else {
            msgShowID = id;
            msgSendId = id;
        }
    }
    $('#msgShowTittele').text(msgShowID);
    bindScrollHistoryEvent.reset();
    if (type == 'GROUP') {
        selType = 'GROUP';
        var options = {
            "GroupIdList": ['' + id + ''],
            'GroupBaseInfoFilter': [
                'Type',
                'Name',
                'Introduction',
                'Notification',
                'FaceUrl',
                'CreateTime',
                'Owner_Account',
                'LastInfoTime',
                'LastMsgTime',
                'NextMsgSeq',
                'MemberNum',
                'MaxMemberNum',
                'ApplyJoinOption',
                'ShutUpAllMember'
            ],
            'MemberInfoFilter': [
                'Account',
                'Role',
                'JoinTime',
                'LastSendMsgTime',
                'ShutUpUntil'
            ]
        }
        webim.getGroupInfo(options, function(dataInfo) {
            var msgNum = dataInfo.GroupInfo[0].NextMsgSeq - 1;
            selSess = null;
            webim.MsgStore.delSessByTypeId(selType, id);
            recentSessMap[webim.SESSION_TYPE.GROUP + "_" + id] = {};
            //recentSessMap[webim.SESSION_TYPE.GROUP + "_" + selToID].MsgGroupReadedSeq = 0;
            recentSessMap[webim.SESSION_TYPE.GROUP + "_" + id].MsgGroupReadedSeq = dataInfo.GroupInfo && dataInfo.GroupInfo[0] && dataInfo.GroupInfo[0].MsgSeq;
            var pram = {
                "GroupId": dataInfo.GroupInfo[0].GroupId,
                "ReqMsgSeq": msgNum,
                "ReqMsgNumber": 15
            }
            webim.syncGroupMsgs(pram, function(resp) {
                for (var i = 0; i < infoMap.length; i++) {
                    for (var j = 0; j < resp.length; j++) {
                        if (infoMap[i].id == resp[j].fromAccount) {
                            resp[j].accountImg = infoMap[i].image
                        }
                    }
                }
                getPrePageGroupHistroyMsgInfoMap[msgShowID] = {
                    "ReqMsgSeq": resp[0].seq - 1
                };
                for (var l in resp) { //遍历新消息
                    var msg = resp[l];
                    if (msg.getSession().id() == dataInfo.GroupInfo[0].GroupId) { //为当前聊天对象的消息
                        selSess = msg.getSession();
                        //消息已读上报，以及设置会话自动已读标记
                        webim.setAutoRead(selSess, true, true);
                        updateSessDiv(msg.getSession().id(), 0);
                        //在聊天窗体中新增一条消息
                        msgListShow(msg);
                        bindScrollHistoryEvent.init();
                    }
                }
            })
        })

    } else {
        selType = 'C2C';
        var pramC2C = {
            "Peer_Account": id,
            "MaxCnt": 15,
            "LastMsgTime": 0,
            "MsgKey": ""
        }
        webim.getC2CHistoryMsgs(pramC2C, function(resp) {
            getPrePageC2CHistroyMsgInfoMap[msgShowID] = {
                'LastMsgTime': resp.LastMsgTime,
                'MsgKey': resp.MsgKey
            };
            selSess = null;
            for (var i = 0; i < infoMap.length; i++) {
                for (var j = 0; j < resp.MsgList.length; j++) {
                    if (infoMap[i].id == resp.MsgList[j].fromAccount) {
                        resp.MsgList[j].accountImg = infoMap[i].image
                    }
                }
            }

            for (var l in resp.MsgList) {
                var msg = resp.MsgList[l];
                if (msg.getSession().id() == id) { //为当前聊天对象的消息
                    selSess = msg.getSession();
                    //消息已读上报，以及设置会话自动已读标记
                    webim.setAutoRead(selSess, true, true);
                    updateSessDiv(msg.getSession().id(), 0);
                    //在聊天窗体中新增一条消息
                    msgListShow(msg);
                    bindScrollHistoryEvent.init();
                }
            }
        })
    }
}


//初始化最近会话的消息未读数

function initUnreadMsgCount() {
    var sess;
    var sessMap = webim.MsgStore.sessMap();
    for (var i in sessMap) {
        sess = sessMap[i];
        for (var i = 0; i < $('.unread').length; i++) {
            if ($($('.unread')[i]).parent('.msg_li').attr('friendid') && $($('.unread')[i]).parent('.msg_li').attr('friendid') != sess.id()) {
                updateSessDiv(sess.id(), sess.unread());
            }
        }
    }
}

//会话消息显示

function msgListShow(msgList, value) {
    var showDiv = document.getElementById('msgShow');
    var msgShow = document.createElement('div');
    msgShow.className = "msgShowDiv";
    var msgTime = document.createElement('div');
    msgTime.innerHTML = new Date(parseInt(msgList.time) * 1000).toLocaleString().substr(0, 20);
    var msgShowImg = document.createElement('img');
    var msgShowP = document.createElement('p');
    var msgRomver = document.createElement('p');

    msgShow.appendChild(msgTime);
    for (var s = 0; s < msgList.elems.length; s++) {
        if (msgList.elems[s].type == "TIMTextElem") {
            if (msgList.isSend) {
                msgShowImg.className = 'showImgRight';
                msgShowP.className = 'msgShowPRight';
                msgTime.className = 'msgTimeRight';
                msgRomver.className = 'msgRomverRight';
                msgShowImg.src = loginInfo.headurl;
            } else {
                msgRomver.className = 'msgRomverLeft';
                msgShowImg.className = 'showImgLeft';
                msgShowP.className = 'msgShowPLeft';
                msgTime.className = 'msgTimeLeft';
                msgShowImg.src = msgList.accountImg;
            }
            msgShowP.innerHTML += msgList.elems[s].content.text;
            msgShow.appendChild(msgShowImg);
            msgRomver.innerHTML = "<a onclick='msgRomver()'>X</a>";
        } else if (msgList.elems[s].type == 'TIMGroupTipElem') {
            msgShowP.className = 'showTip'
            msgShowP.innerHTML = convertGroupTipMsgToHtml(msgList.elems[s].content) //'群提示消息';
            msgTime.className = 'msgTime';
        } else if (msgList.elems[s].type == "TIMCustomElem") {
            if (msgList.isSend) {
                msgShowImg.className = 'showImgRight';
                msgShowP.className = 'msgShowPRight';
                msgTime.className = 'msgTimeRight';
                msgRomver.className = 'msgRomverRight';
                msgShowImg.src = loginInfo.headurl;
            } else {
                msgRomver.className = 'msgRomverLeft';
                msgShowImg.className = 'showImgLeft';
                msgShowP.className = 'msgShowPLeft';
                msgTime.className = 'msgTimeLeft';
                msgShowImg.src = msgList.accountImg;
            }
            msgShowP.innerHTML += '自定义消息：' + msgList.elems[s].content.data + msgList.elems[s].content.desc + msgList.elems[s].content.desc;
            msgRomver.innerHTML = "<a onclick='msgRomver(" + '"' + msgList.MsgRandom + '"' + ")'>X</a>";
        } else if (msgList.elems[s].type == 'TIMImageElem') {
            if (msgList.isSend) {
                msgShowImg.className = 'showImgRight';
                msgShowP.className = 'msgShowPRight';
                msgTime.className = 'msgTimeRight';
                msgRomver.className = 'msgRomverRight';
                msgShowImg.src = loginInfo.headurl;
            } else {
                msgRomver.className = 'msgRomverLeft';
                msgShowImg.className = 'showImgLeft';
                msgShowP.className = 'msgShowPLeft';
                msgTime.className = 'msgTimeLeft';
                msgShowImg.src = msgList.accountImg;
            }
            msgShowP.innerHTML += "<img src='" + msgList.elems[s].content.ImageInfoArray[s].url + "'/>";
            msgRomver.innerHTML = "<a onclick='msgRomver()'>X</a>";
        } else if (msgList.elems[s].type == 'TIMFaceElem') {
            if (msgList.isSend) {
                msgShowImg.className = 'showImgRight';
                msgShowP.className = 'msgShowPRight';
                msgTime.className = 'msgTimeRight';
                msgRomver.className = 'msgRomverRight';
                msgShowImg.src = loginInfo.headurl;
            } else {
                msgRomver.className = 'msgRomverLeft';
                msgShowImg.className = 'showImgLeft';
                msgShowP.className = 'msgShowPLeft';
                msgTime.className = 'msgTimeLeft';
                msgShowImg.src = msgList.accountImg;
            }
            var faceUrl = null;
            var data = msgList.elems[s].content.getData();
            var index = webim.EmotionDataIndexs[data];

            var emotion = webim.Emotions[index];
            if (emotion && emotion[1]) {
                faceUrl = emotion[1];
            }
            if (faceUrl) {
                msgShowP.innerHTML += "<img src='" + faceUrl + "'/>";
            } else {
                msgShowP.innerHTML += data;
            }
            msgRomver.innerHTML = "<a onclick='msgRomver()'>X</a>";
        } else if (msgList.elems[s].type == 'TIMFileElem') {
            if (msgList.isSend) {
                msgShowImg.className = 'showImgRight';
                msgShowP.className = 'msgShowPRight';
                msgTime.className = 'msgTimeRight';
                msgRomver.className = 'msgRomverRight';
                msgShowImg.src = loginInfo.headurl;
            } else {
                msgRomver.className = 'msgRomverLeft';
                msgShowImg.className = 'showImgLeft';
                msgShowP.className = 'msgShowPLeft';
                msgTime.className = 'msgTimeLeft';
                msgShowImg.src = msgList.accountImg;
            }
            msgShowP.innerHTML += "<a title='点击下载文件' onclick='webim.onDownFile(" + '"' + msgList.elems[s].content.uuid + '"' + ")'/>" + msgList.elems[s].content.name + '(' + msgList.elems[s].content.size + 'Byte)' + "</a>";
            msgRomver.innerHTML = "<a onclick='msgRomver()'>X</a>";
        }
    }
    msgShow.appendChild(msgShowImg);
    msgShow.appendChild(msgShowP);
    msgShow.appendChild(msgRomver);
    if (value) {
        showDiv.insertBefore(msgShow, showDiv.childNodes[0]); //插入头部
    } else {
        showDiv.appendChild(msgShow); //默认插入尾部
    }
    //showDiv.appendChild(msgShow);
    var msgflow = document.getElementById('msgShow');
    setTimeout(function() {
        msgflow.scrollTop = showDiv.scrollHeight;
    }, 300);

}

//解析群提示消息元素

function convertGroupTipMsgToHtml(content) {
    var WEB_IM_GROUP_TIP_MAX_USER_COUNT = 10;
    var text = "";
    var maxIndex = WEB_IM_GROUP_TIP_MAX_USER_COUNT - 1;
    var opType, opUserId, userIdList;
    var groupMemberNum;
    opType = content.getOpType(); //群提示消息类型（操作类型）
    opUserId = content.getOpUserId(); //操作人id
    switch (opType) {
        case webim.GROUP_TIP_TYPE.JOIN: //加入群
            userIdList = content.getUserIdList();
            //text += opUserId + "邀请了";
            for (var m in userIdList) {
                text += userIdList[m] + ",";
                if (userIdList.length > WEB_IM_GROUP_TIP_MAX_USER_COUNT && m == maxIndex) {
                    text += "等" + userIdList.length + "人";
                    break;
                }
            }
            text = text.substring(0, text.length - 1);
            text += "加入该群，当前群成员数：" + content.getGroupMemberNum();
            break;
        case webim.GROUP_TIP_TYPE.QUIT: //退出群
            text += opUserId + "离开该群，当前群成员数：" + content.getGroupMemberNum();
            break;
        case webim.GROUP_TIP_TYPE.KICK: //踢出群
            text += opUserId + "将";
            userIdList = content.getUserIdList();
            for (var m in userIdList) {
                text += userIdList[m] + ",";
                if (userIdList.length > WEB_IM_GROUP_TIP_MAX_USER_COUNT && m == maxIndex) {
                    text += "等" + userIdList.length + "人";
                    break;
                }
            }
            text += "踢出该群";
            break;
        case webim.GROUP_TIP_TYPE.SET_ADMIN: //设置管理员
            text += opUserId + "将";
            userIdList = content.getUserIdList();
            for (var m in userIdList) {
                text += userIdList[m] + ",";
                if (userIdList.length > WEB_IM_GROUP_TIP_MAX_USER_COUNT && m == maxIndex) {
                    text += "等" + userIdList.length + "人";
                    break;
                }
            }
            text += "设为管理员";
            break;
        case webim.GROUP_TIP_TYPE.CANCEL_ADMIN: //取消管理员
            text += opUserId + "取消";
            userIdList = content.getUserIdList();
            for (var m in userIdList) {
                text += userIdList[m] + ",";
                if (userIdList.length > WEB_IM_GROUP_TIP_MAX_USER_COUNT && m == maxIndex) {
                    text += "等" + userIdList.length + "人";
                    break;
                }
            }
            text += "的管理员资格";
            break;

        case webim.GROUP_TIP_TYPE.MODIFY_GROUP_INFO: //群资料变更
            text += opUserId + "修改了群资料：";
            var groupInfoList = content.getGroupInfoList();
            var type, value;
            for (var m in groupInfoList) {
                type = groupInfoList[m].getType();
                value = groupInfoList[m].getValue();
                switch (type) {
                    case webim.GROUP_TIP_MODIFY_GROUP_INFO_TYPE.FACE_URL:
                        text += "群头像为" + value + "; ";
                        break;
                    case webim.GROUP_TIP_MODIFY_GROUP_INFO_TYPE.NAME:
                        text += "群名称为" + value + "; ";
                        break;
                    case webim.GROUP_TIP_MODIFY_GROUP_INFO_TYPE.OWNER:
                        text += "群主为" + value + "; ";
                        break;
                    case webim.GROUP_TIP_MODIFY_GROUP_INFO_TYPE.NOTIFICATION:
                        text += "群公告为" + value + "; ";
                        break;
                    case webim.GROUP_TIP_MODIFY_GROUP_INFO_TYPE.INTRODUCTION:
                        text += "群简介为" + value + "; ";
                        break;
                    default:
                        text += "未知信息为:type=" + type + ",value=" + value + "; ";
                        break;
                }
            }
            break;

        case webim.GROUP_TIP_TYPE.MODIFY_MEMBER_INFO: //群成员资料变更(禁言时间)
            text += opUserId + "修改了群成员资料:";
            var memberInfoList = content.getMemberInfoList();
            var userId, shutupTime;
            for (var m in memberInfoList) {
                userId = memberInfoList[m].getUserId();
                shutupTime = memberInfoList[m].getShutupTime();
                text += userId + ": ";
                if (shutupTime != null && shutupTime !== undefined) {
                    if (shutupTime == 0) {
                        text += "取消禁言; ";
                    } else {
                        text += "禁言" + shutupTime + "秒; ";
                    }
                } else {
                    text += " shutupTime为空";
                }
                if (memberInfoList.length > WEB_IM_GROUP_TIP_MAX_USER_COUNT && m == maxIndex) {
                    text += "等" + memberInfoList.length + "人";
                    break;
                }
            }
            break;
        default:
            text += "未知群提示消息类型：type=" + opType;
            break;
    }
    return text;
}

//好友列表

function friendList(data) {
    if (data && data.length >= 0) {
        var sessDiv = document.getElementById("bF");
        for (var i = 0; i < data.length; i++) {
            var faceImg = document.createElement("img");
            faceImg.className = "fr_img";
            if (data[i].SnsProfileItem && data[i].SnsProfileItem[1] && data[i].SnsProfileItem[1].Value != '') {
                faceImg.src = data[i].SnsProfileItem[1].Value;
            } else {
                faceImg.src = 'img/me.jpg'
            }
            var nameLi = document.createElement("li");
            nameLi.className = "friend_list";
            var content = document.createElement("span");
            if (data[i].SnsProfileItem && data[i].SnsProfileItem[0].Value != '') {
                content.innerHTML = data[i].SnsProfileItem[0].Value;
            } else {
                content.innerHTML = data[i].Info_Account;
            }
            var addBlack = document.createElement('span');
            addBlack.className = "removeClass";
            addBlack.innerHTML = "<span class='removeID' onclick='addBlack(" + '"' + data[i].Info_Account + '"' + ")'>" + "拉黑" + "</span>";
            var deleteUser = document.createElement('span');
            deleteUser.className = "removeClass";
            deleteUser.innerHTML = "<span class='removeID' onclick='deleteUser(" + '"' + data[i].Info_Account + '"' + ")'>" + "删除" + "</span>";

            nameLi.appendChild(faceImg);
            nameLi.appendChild(content);
            nameLi.appendChild(addBlack);
            nameLi.appendChild(deleteUser);
            sessDiv.appendChild(nameLi);
        }
    } else {
        alert('还没有好友哦。')
    }
}

function chioceFriend(data) {
    if (data && data.length >= 0) {
        var chioceDiv = document.getElementById("chioceDiv");
        for (var i = 0; i < data.length; i++) {
            var faceImg = document.createElement("img");
            faceImg.className = "fr_img";
            if (data[i].SnsProfileItem && data[i].SnsProfileItem[1] && data[i].SnsProfileItem[1].Value != '') {
                faceImg.src = data[i].SnsProfileItem[1].Value;
            } else {
                faceImg.src = 'img/me.jpg'
            }
            var chioceLi = document.createElement("div");
            chioceLi.className = "friend_chioce_list";
            var content = document.createElement("span");
            if (data[i].SnsProfileItem && data[i].SnsProfileItem[0].Value != '') {
                content.innerHTML = data[i].SnsProfileItem[0].Value;
            } else {
                content.innerHTML = data[i].Info_Account;
            }
            var addUser = document.createElement('span');
            addUser.className = "removeClass";
            addUser.innerHTML = "<span class='removeID' onclick='chioceF(" + '"' + data[i].Info_Account + '",true' + ")'>" + "增加" + "</span>";
            var escUser = document.createElement('span');
            escUser.className = "removeClass";
            escUser.innerHTML = "<span class='removeID' onclick='chioceF(" + '"' + data[i].Info_Account + '",false' + ")'>" + "取消" + "</span>";

            chioceLi.appendChild(faceImg);
            chioceLi.appendChild(content);
            chioceLi.appendChild(addUser);
            chioceLi.appendChild(escUser);
            chioceDiv.appendChild(chioceLi);
        }
    } else {
        alert('还没有好友哦。')
    }
}

var selectList = [];

function chioceF(id, value) {
    if (value) {
        if (selectList.length == 0) {
            selectList.push(id);
        } else {
            for (var j = 0; j < selectList.length; j++) {
                if (selectList[j] == id) {
                    alert('已选择该好友');
                    return;
                }
            }
            selectList.push(id);
        }
    } else {
        if (selectList.length == 0) {
            alert('没有选择该好友，不能取消');
            return;
        } else {
            for (var i = 0; i < selectList.length; i++) {
                if (selectList[i] && selectList[i] == id) {
                    selectList.splice(i, 1);
                    document.getElementById("selectedList").innerHTML = selectList.join("<br />");
                    return;
                }
            }
            alert('没有选择该好友，不能取消');
        }
    }
    document.getElementById("selectedList").innerHTML = selectList.join(";<br />");
}

//拉黑好友

function addBlack(id) {
    var options = {
        "From_Account": loginInfo.identifier,
        "To_Account": ['' + id + '']
    }
    webim.addBlackList(options, function(resp) {
        $('.friend_list').remove();
        initInfoList();
    })
}

//删除好友

function deleteUser(id) {
    var options = {
        "From_Account": loginInfo.identifier,
        "To_Account": ['' + id + ''],
        "DeleteType": "Delete_Type_Single"
    }
    webim.deleteFriend(options, function(resp) {
        $('.friend_list').remove();
        initInfoList();
    })
}

//获取黑名单资料

function blackList() {
    $('.conetet').hide();
    $('#create').hide();
    $('.moreList').show();
    $('.addClass').hide();
    $('#moreListTittle').text('黑名单');
    var options = {
        'From_Account': loginInfo.identifier,
        'StartIndex': 0,
        'MaxLimited': 100,
        'LastSequence': 0
    };

    webim.getBlackList(
        options,
        function(resp) {
            var pramList = [];
            for (var i = 0; i < resp.BlackListItem.length; i++) {
                pramList.push(resp.BlackListItem[i].To_Account)
            }
            var pram = {
                "To_Account": pramList,
                "TagList": [
                    "Tag_Profile_IM_Nick",
                    "Tag_Profile_IM_Image"
                ]
            }
            webim.getProfilePortrait(pram, function(resp) {
                var list = resp.UserProfileItem;
                for (var i = 0; i < list.length; i++) {
                    for (var j = 0; j < resp.UserProfileItem.length; j++) {
                        if (list[i].To_Account == resp.UserProfileItem[j].To_Account) {
                            if (list[i].ProfileItem) {
                                if (list[i].ProfileItem[0].Value) {
                                    list[i].Name = list[i].ProfileItem[0].Value;
                                } else {
                                    list[i].Name = resp.UserProfileItem[j].To_Account;
                                }
                                if (list[i].ProfileItem[1].Value) {
                                    list[i].FaceUrl = list[i].ProfileItem[1].Value;
                                } else {
                                    list[i].FaceUrl = 'img/me.jpg';
                                }
                            } else {
                                list[i].Name = resp.UserProfileItem[j].To_Account;
                                list[i].FaceUrl = 'img/me.jpg';
                            }
                        }
                    }
                }

                moreList(list)
            })
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );
}

//黑名单列表、群组列表展示

function moreList(data) {
    if (data.length >= 0) {
        var sessDiv = document.getElementById("moreList");
        for (var i = 0; i < data.length; i++) {
            var faceImg = document.createElement("img");
            faceImg.className = "fr_img";
            if (data[i].FaceUrl != '') {
                faceImg.src = data[i].FaceUrl;
            } else {
                faceImg.src = 'img/me.jpg'
            }
            var nameLi = document.createElement("div");
            nameLi.className = "friend_list_more";
            var content = document.createElement("span");
            if (data[i].Name != '') {
                content.innerHTML = data[i].Name;
            } else if (data[i].To_Account) {
                content.innerHTML = data[i].To_Account;
            } else {
                content.innerHTML = data[i].GroupId;
            }
            var removeUser = document.createElement("div");
            removeUser.className = "removeClass";
            removeUser.id = "removeClass"
            if (data[i].To_Account) {
                if ($('.searchAndAdd').attr('selectType')) {
                    removeUser.innerHTML = "<a class='faceBtn listSend' onclick='msgList(" + '"' + data[i].To_Account + '"' + ',"GROUP"' + ")'></a>" + "<a class='faceBtn lookMember' onclick='selectGroupMember(" + '"' + data[i].To_Account + '"' + ")'></a>" + "<a class='faceBtn editGroup' onclick='selectGroup(" + '"' + data[i].To_Account + '"' + ")'></a>" + "<span class='removeID' onclick='removeList(" + '"' + data[i].To_Account + '"' + ")'>" + "X" + "</span>";
                } else {
                    removeUser.innerHTML = "<span class='removeID' onclick='removeList(" + '"' + data[i].To_Account + '"' + ")'>" + "X" + "</span>";
                }
            } else {
                if ($('.searchAndAdd').attr('selectType')) {
                    removeUser.innerHTML = "<a class='faceBtn listSend' onclick='msgList(" + '"' + data[i].GroupId + '"' + ',"GROUP"' + ")'></a>" + "<a class='faceBtn lookMember' onclick='selectGroupMember(" + '"' + data[i].GroupId + '"' + ")'></a>" + "<a class='faceBtn editGroup' onclick='selectGroup(" + '"' + data[i].GroupId + '"' + ")'></a>" + "<span class='removeID' onclick='removeList(" + '"' + data[i].GroupId + '"' + ")'>" + "X" + "</span>";
                } else {
                    removeUser.innerHTML = "<span class='removeID' onclick='removeList(" + '"' + data[i].GroupId + '"' + ")'>" + "X" + "</span>";
                }
            }
            nameLi.appendChild(faceImg);
            nameLi.appendChild(content);
            nameLi.appendChild(removeUser);
            sessDiv.appendChild(nameLi);
        }
    } else {
        alert('列表为空。');
    }
}

//加入黑名单

function removeList(id) {
    var id = id;
    if ($('#moreListTittle').text() == '黑名单') {
        removeBlack(id)
    } else {
        removeGroup(id)
    }
}

//查看群成员列表

function selectGroupMember(id) {
    $('.moreList').hide();
    $('.memberList').show();
    var options = {
        "GroupId": id,
        "Offset": 0,
        "Limit": 200,
        "MemberInfoFilter": ["Account", "Role", "JoinTime", "LastSendMsgTime", "ShutUpUntil"]
    }
    webim.getGroupMemberInfo(options, function(resp) {
        for (var i = 0; i < resp.MemberList.length; i++) {
            for (var j = 0; j < infoMap.length; j++) {
                if (resp.MemberList[i].Member_Account == infoMap[j].id) {
                    resp.MemberList[i].faceUrl = infoMap[j].image;
                    resp.MemberList[i].userName = infoMap[j].name;
                } else if (resp.MemberList[i].Member_Account == loginInfo.identifier) {
                    resp.MemberList[i].faceUrl = loginInfo.headurl;
                    resp.MemberList[i].userName = loginInfo.identifierNick;
                }
            }
            if ((resp.MemberList[i].Member_Account == loginInfo.identifier) && ((resp.MemberList[i].Role == "Owner") || (resp.MemberList[i].Role == "Admin"))) {
                for (var p = 0; p < resp.MemberList.length; p++) {
                    resp.MemberList[p].roleType = true;
                }
            }

            if (resp.MemberList[i].Role == "Owner") {
                resp.MemberList[i].roleText = '群主';
            } else if (resp.MemberList[i].Role == "Admin") {
                resp.MemberList[i].roleText = '管理员';
            } else {
                resp.MemberList[i].roleText = '成员';
            }
        }
        var memData = resp.MemberList;
        var memDiv = document.getElementById("memDiv");
        for (var l in memData) {
            var faceImg = document.createElement("img");
            faceImg.className = "memberImg";
            if (memData[l].faceUrl != '') {
                faceImg.src = memData[l].faceUrl;
            } else {
                faceImg.src = 'img/me.jpg'
            }
            var nameLi = document.createElement("div");
            nameLi.className = "GroupMemberList";
            var content = document.createElement("span");
            if (memData[l].userName != '') {
                content.innerHTML = memData[l].userName;
            } else {
                content.innerHTML = memData[l].Member_Account;
            }
            var removeUser = document.createElement("div");
            if (memData[l].roleType) {
                removeUser.className = 'manageMember';
                removeUser.setAttribute('roleType', memData[l].Role);
                removeUser.setAttribute('userId', memData[l].Member_Account);
                if ($('#moreListTittle').text() == '私有群') {
                    removeUser.innerHTML = "<a class='faceBtn memBanned' onclick='bannedGroup(" + '"' + id + '","' + memData[l].Member_Account + '","' + memData[l].Role + '"' + ")'></a><a class='faceBtn kickList' onclick='kickGroup(" + '"' + id + '","' + memData[l].Member_Account + '","' + memData[l].Role + '"' + ")'></a>";
                } else {
                    removeUser.innerHTML = "<a class='faceBtn memBanned' onclick='bannedGroup(" + '"' + id + '","' + memData[l].Member_Account + '","' + memData[l].Role + '"' + ")'></a><a class='faceBtn kickList' onclick='kickGroup(" + '"' + id + '","' + memData[l].Member_Account + '","' + memData[l].Role + '"' + ")'></a><a class='faceBtn editGroup' onclick='upRole(" + '"' + id + '","' + memData[l].Member_Account + '","' + memData[l].Role + '"' + ")'></a>";
                }

            } else {
                removeUser.className = "removeClass";
                removeUser.innerHTML = memData[l].roleText;
            }
            var bannedSpan = document.createElement('span');
            bannedSpan.className = 'bannedTo';
            var newDate = (Math.round(new Date().getTime() / 1000));
            if (memData[l].ShutUpUntil > newDate) {
                bannedSpan.innerHTML = '禁言中' + '&nbsp;' + memData[l].roleText;
            } else {
                bannedSpan.innerHTML = '未禁言' + '&nbsp;' + memData[l].roleText;
            }
            nameLi.appendChild(faceImg);
            nameLi.appendChild(content);
            nameLi.appendChild(removeUser);
            nameLi.appendChild(bannedSpan);
            memDiv.appendChild(nameLi);
        }
    })
}

//用户禁言显示框

function bannedGroup(groupId, userId, role) {
    var value;
    for (var i = 0; i < $('.manageMember').length; i++) {
        if (($($('.manageMember')[i]).attr('userId') == loginInfo.identifier) && ($($('.manageMember')[i]).attr('roleType') == 'Owner')) {
            value = true;
        } else if (($($('.manageMember')[i]).attr('userId') == loginInfo.identifier) && ($($('.manageMember')[i]).attr('roleType') == 'Admin')) {
            value = false;
        }
    }

    if (value) {
        if (userId == loginInfo.identifier) {
            alert('不能对自己禁言');
            return;
        }
    } else {
        if (userId == loginInfo.identifier) {
            alert('不能对自己禁言');
            return;
        }
        if ($('#moreListTittle').text() == '私有群') {
            alert('私有群只有群主能禁言');
            return;
        }
        if ((role == 'Owner') || (role == 'Admin')) {
            alert('不能对群组与管理员禁言');
            return;
        }
    }

    $('.forbidDiv').show();
    $('#groupIdName').text(groupId);
    $('#groupMemberId').text(userId);
}

//给用户禁言

function forbid() {

    var shutTime = parseInt($('#forbidTime').val());
    if (!webim.Tool.validNumber(shutTime)) {
        alert('您输入的禁言时间非法,只能是数字(0-31536000)');
        return;
    }
    if (shutTime > 31536000) {
        alert('您输入的禁言时间非法,只能是数字(0-31536000)');
        return;
    }

    var options = {
        'GroupId': $('#groupIdName').text(),
        'Members_Account': [$('#groupMemberId').text()],
        'ShutUpTime': shutTime
    };
    webim.forbidSendMsg(
        options,
        function(resp) {
            $('.forbidDiv').hide();
            alert('设置成员禁言时间成功');
            $('.GroupMemberList').remove();
            selectGroupMember($('#groupIdName').text())
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );
}

//群成员角色

function upRole(groupId, userId, role) {
    var value;
    for (var i = 0; i < $('.manageMember').length; i++) {
        if (($($('.manageMember')[i]).attr('userId') == loginInfo.identifier) && ($($('.manageMember')[i]).attr('roleType') == 'Owner')) {
            value = true;
        } else if (($($('.manageMember')[i]).attr('userId') == loginInfo.identifier) && ($($('.manageMember')[i]).attr('roleType') == 'Admin')) {
            value = false;
        }
    }

    if (value) {
        if (userId == loginInfo.identifier) {
            alert('不能设置自己的角色');
            return;
        }
        if ($('#moreListTittle').text() == '私有群') {
            alert('私有群不能设置管理员');
            return;
        }
    } else if (value) {
        alert('只有群主能设置管理员');
        return;
    }

    var needRole;
    if (role == 'Admin') {
        needRole = 'Member'
    } else if (role == 'Member') {
        needRole = 'Admin'
    }

    var options = {
        'GroupId': groupId,
        'Member_Account': userId,
        'Role': needRole
    }

    webim.modifyGroupMember(options, function(resp) {
        alert('修改成功');
        $('.GroupMemberList').remove();
        selectGroupMember(groupId)
    })
}

//移出群组

function kickGroup(groupId, userId, role) {
    var value;
    for (var i = 0; i < $('.manageMember').length; i++) {
        if (($($('.manageMember')[i]).attr('userId') == loginInfo.identifier) && ($($('.manageMember')[i]).attr('roleType') == 'Owner')) {
            value = true;
        } else if (($($('.manageMember')[i]).attr('userId') == loginInfo.identifier) && ($($('.manageMember')[i]).attr('roleType') == 'Admin')) {
            value = false;
        }
    }
    if (value) {
        if (userId == loginInfo.identifier) {
            alert('不能将自己移出群组');
            return;
        }
    } else {
        if (userId == loginInfo.identifier) {
            alert('不能将自己移出群组');
            return;
        }
        if ((role == 'Owner') || (role == 'Admin')) {
            alert('不能将群组与管理员移出群组');
            return;
        }
    }
    var options = {
        'GroupId': groupId,
        'MemberToDel_Account': [userId]
    }
    webim.deleteGroupMember(options, function() {
        $('.GroupMemberList').remove();
        selectGroupMember(groupId)
    })
}

//将用户黑名单移出

function removeBlack(id) {
    var options = {
        "From_Account": loginInfo.identifier,
        "To_Account": [id]
    };

    webim.deleteBlackList(
        options,
        function(resp) {
            $('.friend_list_more').remove();
            blackList();
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );

}

//退出群组

function removeGroup(id) {
    var parm = {
        'GroupId': id,
        'User_Account': [loginInfo.identifier]
    }

    webim.getRoleInGroup(parm, function(resp) {
        if (resp.UserIdList[0].Role == "Owner") {
            var data = {
                'GroupId': id
            }
            webim.destroyGroup(data, function(resp) {
                $('.friend_list_more').remove();
                if ($('#moreListTittle').text() == '公开群') {
                    type = 'Public';
                } else if ($('#moreListTittle').text() == '私有群') {
                    type = 'Private';
                } else if ($('#moreListTittle').text() == '聊天室') {
                    type = 'ChatRoom';
                }
                var options = {
                    'Member_Account': loginInfo.identifier,
                    'Offset': 0,
                    "GroupType": type,
                    "GroupBaseInfoFilter": [ // 需要哪些基础信息字段
                        "Name",
                        "FaceUrl"
                    ]
                };

                webim.getJoinedGroupListHigh(
                    options,
                    function(resp) {
                        moreList(resp.GroupIdList)
                    })

            })
        } else {
            var options = {
                "GroupId": '' + id + ''
            }

            webim.quitGroup(options, function(resp) {
                $('.friend_list_more').remove();
                var type;
                if ($('#moreListTittle').text() == '公开群') {
                    type = 'Public';
                } else if ($('#moreListTittle').text() == '私有群') {
                    type = 'Private';
                } else if ($('#moreListTittle').text() == '聊天室') {
                    type = 'ChatRoom';
                }
                var options = {
                    'Member_Account': loginInfo.identifier,
                    'Offset': 0,
                    "GroupType": type,
                    "GroupBaseInfoFilter": [
                        "Name",
                        "FaceUrl"
                    ]
                }
                webim.getJoinedGroupListHigh(
                    options,
                    function(resp) {
                        moreList(resp.GroupIdList)
                    }
                );
            })
        }
    })

}

//分类查询展示群组列表
$('#friend').find('li').click(function() {
    $('.conetet').hide();
    $('.moreList').show();
    $('#create').show();
    $("#addGroup").show();
    $('.searchAndAdd').attr('selectType', true);
    $('#moreListTittle').text($(this).text());
    var options = {
        'Member_Account': loginInfo.identifier,
        'Offset': 0,
        "GroupType": $(this).attr('value'),
        "GroupBaseInfoFilter": [ // 需要哪些基础信息字段
            "Name",
            "FaceUrl"
        ]
    };

    webim.getJoinedGroupListHigh(
        options,
        function(resp) {
            moreList(resp.GroupIdList)
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );
})

//搜索用户、群组
$('#searchButton').click(function() {
    if ($('#searchId').val().length <= 0) {
        alert('请输入要查找的ID');
        return;
    }

    if ($('.searchAndAdd').hasClass('friendIdentify')) {
        findFriend($('#searchId').val());
    } else {
        findGroup($('#searchId').val());
    }
})

//根据id搜索用户

function findFriend(id) {
    var tag_list = [
        "Tag_Profile_IM_Nick", //昵称
        "Tag_Profile_IM_Image", //头像
        "Tag_Profile_IM_AllowType" //加好友验证方式
    ];

    var options = {
        'To_Account': [id],
        'TagList': tag_list
    }

    webim.getProfilePortrait(
        options,
        function(resp) {
            var list = resp.UserProfileItem;
            for (var i = 0; i < list.length; i++) {
                for (var j = 0; j < resp.UserProfileItem.length; j++) {
                    if (list[i].To_Account == resp.UserProfileItem[j].To_Account) {
                        if (list[i].ProfileItem) {
                            if (list[i].ProfileItem[0].Value) {
                                list[i].Name = list[i].ProfileItem[0].Value;
                            } else {
                                list[i].Name = resp.UserProfileItem[j].To_Account;
                            }
                            if (list[i].ProfileItem[1].Value) {
                                list[i].FaceUrl = list[i].ProfileItem[1].Value;
                            } else {
                                list[i].FaceUrl = 'img/me.jpg';
                            }
                        } else {
                            list[i].Name = resp.UserProfileItem[j].To_Account;
                            list[i].FaceUrl = 'img/me.jpg';
                        }
                    }
                }
            }
            searchList(list);
        },
        function(err) {
            alert('请检查此帐号是否存在。');
        }
    );
}

//根据群组id搜索群组

function findGroup(id) {
    var tag_list = [
        "Name", //昵称
        "FaceUrl" //头像
    ];

    var options = {
        'GroupIdList': [id],
        'GroupBasePublicInfoFilter': tag_list
    }

    webim.getGroupPublicInfo(
        options,
        function(resp) {
            var list = resp.GroupInfo;
            for (var i = 0; i < list.length; i++) {
                for (var j = 0; j < resp.GroupInfo.length; j++) {
                    if (list[i].GroupId == resp.GroupInfo[j].GroupId) {
                        list[i].To_Account = list[i].GroupId;
                    }
                }
            }
            searchList(list);
        },
        function(err) {
            alert('请检查此群组是否存在。');
        }
    );
}

//搜索之后展示列表

function searchList(data) {
    if (data.length >= 0) {
        var sessDiv = document.getElementById("searchList");
        for (var i = 0; i < data.length; i++) {
            var faceImg = document.createElement("img");
            faceImg.className = "searchImg";
            if (data[i].FaceUrl != '') {
                faceImg.src = data[i].FaceUrl;
            } else {
                faceImg.src = 'img/me.jpg'
            }
            var nameLi = document.createElement("div");
            nameLi.className = "friend_list_more";
            var content = document.createElement("div");
            content.className = 'searchListDiv';
            if (data[i].Name != '') {
                content.innerHTML = "<span>" + data[i].Name + "</span></br><span class='cdColor' id='addId'>" + data[i].To_Account + "</span>";
            } else {
                content.innerHTML = "<span>" + data[i].To_Account + "</span></br><span class='cdColor' id='addId'>" + data[i].To_Account + "</span>";
            }
            var add = document.createElement("span");
            add.className = 'addUser';
            add.innerHTML = '+';

            add.onclick = function() {
                if ($('.searchAndAdd').hasClass('friendIdentify')) {
                    addFriend();
                } else {
                    addGroup();
                }
            };

            nameLi.appendChild(faceImg);
            nameLi.appendChild(content);
            nameLi.appendChild(add);
            sessDiv.appendChild(nameLi);
        }
    }
}

//添加好友

function addFriend() {
    var options = {
        'From_Account': loginInfo.identifier,
        'AddFriendItem': [{
            'To_Account': $("#addId").text(),
            "AddSource": "AddSource_Type_Unknow"
        }]
    };

    webim.applyAddFriend(
        options,
        function(resp) {
            alert('加好友成功，请等待同意');
            $('.searchAndAdd').hide();
            $('.conetet').show();
            $('.friend_list_more').remove();
            $("#addId").text('');
            $('.friend_list').remove();
            initInfoList();
        },
        function(err) {
            alert('添加好友失败,请检查是否已是好友或者在黑名单');
        }
    );
}

//添加群组

function addGroup() {
    var options = {
        'GroupId': $("#addId").text()
    };
    webim.applyJoinGroup(
        options,
        function(resp) {
            alert('加群成功，请等待群组同意');
            $('.friend_list_more').remove();
            $("#addId").text('');
            $('.searchAndAdd').hide();
            $('.conetet').show();
        },
        function(err) {
            alert('加群失败,请检查是否已是群内人员');
        }
    );
}

//好友申请列表

function applyFriendList() {
    $('.conetet').hide();
    $('.moreList').show();
    $('#create').hide();
    $('#moreListTittle').text('好友申请');
    var options = {
        'From_Account': loginInfo.identifier,
        'PendencyType': 'Pendency_Type_ComeIn',
        'StartTime': 0,
        'MaxLimited': 100,
        'LastSequence': 0
    };

    webim.getPendency(options, function(resp) {
        if (resp.PendencyItem) {
            var pramList = [];
            for (var i = 0; i < resp.PendencyItem.length; i++) {
                pramList.push(resp.PendencyItem[i].To_Account)
            }
            var pram = {
                "To_Account": pramList,
                "TagList": [
                    "Tag_Profile_IM_Nick",
                    "Tag_Profile_IM_Image"
                ]
            }
            webim.getProfilePortrait(pram, function(resp) {
                var list = resp.UserProfileItem;
                for (var i = 0; i < list.length; i++) {
                    for (var j = 0; j < resp.UserProfileItem.length; j++) {
                        if (list[i].To_Account == resp.UserProfileItem[j].To_Account) {
                            if (list[i].ProfileItem) {
                                if (list[i].ProfileItem[0].Value) {
                                    list[i].Name = list[i].ProfileItem[0].Value;
                                } else {
                                    list[i].Name = resp.UserProfileItem[j].To_Account;
                                }
                                if (list[i].ProfileItem[1].Value) {
                                    list[i].FaceUrl = list[i].ProfileItem[1].Value;
                                } else {
                                    list[i].FaceUrl = 'img/me.jpg';
                                }
                            } else {
                                list[i].Name = resp.UserProfileItem[j].To_Account;
                                list[i].FaceUrl = 'img/me.jpg';
                            }
                        }
                    }
                }

                applyListShow(list)
            })
        } else {
            alert('还没有好友申请');
        }
    })
}

//群申请列表

function applyGroupList() {

}

//申请列表展示

function applyListShow(data) {
    if (data && data.length >= 0) {
        var sessDiv = document.getElementById("moreList");
        for (var i = 0; i < data.length; i++) {
            var faceImg = document.createElement("img");
            faceImg.className = "fr_img";
            if (data[i].FaceUrl && data[i].FaceUrl != '') {
                faceImg.src = data[i].FaceUrl;
            } else {
                faceImg.src = 'img/me.jpg'
            }
            var nameLi = document.createElement("p");
            nameLi.className = "friend_list_more";
            var content = document.createElement("span");
            if (data[i].Name && data[i].Name != '') {
                content.innerHTML = data[i].Name;
            } else {
                content.innerHTML = data[i].To_Account;
            }
            var addBlack = document.createElement('span');
            addBlack.className = "removeClass";
            addBlack.innerHTML = "<span class='removeID' onclick='applyManager(" + '"' + data[i].To_Account + '"' + ",true)'>" + "同意" + "</span>";
            var deleteUser = document.createElement('span');
            deleteUser.className = "removeClass";
            deleteUser.innerHTML = "<span class='removeID' onclick='applyManager(" + '"' + data[i].To_Account + '"' + ",false)'>" + "拒绝" + "</span>";

            nameLi.appendChild(faceImg);
            nameLi.appendChild(content);
            nameLi.appendChild(addBlack);
            nameLi.appendChild(deleteUser);
            sessDiv.appendChild(nameLi);
        }
    }
}

//加好友申请处理

function applyManager(id, value) {
    if (value) {
        var agree = {
            'From_Account': loginInfo.identifier,
            'ResponseFriendItem': [{
                'To_Account': id,
                "ResponseAction": 'Response_Action_AgreeAndAdd'
            }]
        }
        webim.responseFriend(agree, function(resp) {
            $('.friend_list_more').remove();
            applyFriendList()
        })
    } else {
        var unagree = {
            'From_Account': loginInfo.identifier,
            'PendencyType': 'Pendency_Type_ComeIn',
            'To_Account': ['' + id + '']
        }
        webim.deletePendency(unagree, function(resp) {
            $('.friend_list_more').remove();
            applyFriendList()
        })
    }
}

//创建群组

function createGroup() {
    var sel_friends = $('#selectedList').text();

    var member_list = [];
    var members = sel_friends.split(";"); //字符分割
    for (var i = 0; i < members.length; i++) {
        if (members[i] && members[i].length > 0) {
            member_list.push(members[i]);
        }
    }
    var faceurl = $("#groupUrl").val();
    var cg_id = $("#groupId").val().trim();
    if (cg_id && !/^[A-Za-z0-9_]+$/gi.test(cg_id)) {
        alert('群组ID只能是数字、字母或下划线');
        return
    }
    if ($("#groupName").val().length == 0) {
        alert('请输入群组名称');
        return;
    }

    if (webim.Tool.trimStr($("#groupName").val()).length == 0) {
        alert('您输入的群组名称全是空格,请重新输入');
        return;
    }
    if (webim.Tool.getStrBytes($("#groupName").val()) > 30) {
        alert('您输入的群组名称超出限制(最长10个汉字)');
        return;
    }
    if (webim.Tool.getStrBytes($("#groupNotice").val()) > 150) {
        alert('您输入的群组公告超出限制(最长50个汉字)');
        return;
    }
    if (webim.Tool.getStrBytes($("#groupIntro").val()) > 120) {
        alert('您输入的群组简介超出限制(最长40个汉字)');
        return;
    }
    var groupType = $('input[name="groptType"]:checked').val();
    var options = {
        'GroupId': cg_id,
        'Owner_Account': loginInfo.identifier,
        'Type': groupType, //Private/Public/ChatRoom/AVChatRoom
        'Name': $("#groupName").val(),
        'Notification': $("#groupNotice").val(),
        'Introduction': $('#groupIntro').val(),
        'MemberList': member_list
    };
    if (faceurl) {
        options.FaceUrl = faceurl;
    }
    if (groupType != 'Private') { //非私有群才支持ApplyJoinOption属性
        options.ApplyJoinOption = $('input[name="groptMode"]:checked').val();
    }
    webim.createGroup(
        options,
        function(resp) {
            alert('创建群成功');
            var allInput = document.body.getElementsByTagName("input");
            for (var i = 0; i < allInput.length; i++) {
                allInput[i].value = "";
            }
            var allText = document.body.getElementsByTagName("textarea");
            for (var i = 0; i < allText.length; i++) {
                allText[i].value = "";
            }
            $('#selectedList').text('');
            $('#createGroupDate').hide();
            $('.conetet').show();
            initInfoList();

        },

        function(err) {
            alert('创建群失败');
        }
    );
}

//消息发送
$('.sendButton').click(function() {
    if ($('#upd_pic').attr('up') == 'true') {
        uploadPic();
    } else if ($('#upd_file').attr('up') == 'true') {
        uploadFile();
    } else {
        if (!selSess) {
            var selSess = new webim.Session(selType, msgSendId, msgSendId, masSendUrl, Math.round(new Date().getTime() / 1000));
        }
        var isSend = true; //是否为自己发送
        var seq = -1; //消息序列，-1表示sdk自动生成，用于去重
        var random = Math.round(Math.random() * 4294967296); //消息随机数，用于去重
        var msgTime = Math.round(new Date().getTime() / 1000); //消息时间戳
        var subType; //消息子类型
        if (selType == webim.SESSION_TYPE.C2C) {
            subType = webim.C2C_MSG_SUB_TYPE.COMMON;
        } else {
            subType = webim.GROUP_MSG_SUB_TYPE.COMMON;
        }
        var msg = new webim.Msg(selSess, isSend, seq, random, msgTime, loginInfo.identifier, subType, loginInfo.identifierNick);

        var text_obj, face_obj, tmsg, emotionIndex, emotion, restMsgIndex;
        //解析文本和表情
        var expr = /\[[^[\]]{1,3}\]/mg;
        var emotions = $('#sendMsg').val().match(expr);
        if (!emotions || emotions.length < 1) {
            text_obj = new webim.Msg.Elem.Text($('#sendMsg').val());
            msg.addText(text_obj);
        } else {
            for (var i = 0; i < emotions.length; i++) {
                tmsg = $('#sendMsg').val().substring(0, $('#sendMsg').val().indexOf(emotions[i]));
                if (tmsg) {
                    text_obj = new webim.Msg.Elem.Text(tmsg);
                    msg.addText(text_obj);
                }
                emotionIndex = webim.EmotionDataIndexs[emotions[i]];
                emotion = webim.Emotions[emotionIndex];

                if (emotion) {
                    face_obj = new webim.Msg.Elem.Face(emotionIndex, emotions[i]);
                    msg.addFace(face_obj);
                } else {
                    text_obj = new webim.Msg.Elem.Text(emotions[i]);
                    msg.addText(text_obj);
                }
                restMsgIndex = $('#sendMsg').val().indexOf(emotions[i]) + emotions[i].length;
                $('#sendMsg').val($('#sendMsg').val().substring(restMsgIndex))
            }
            if ($('#sendMsg').val()) {
                text_obj = new webim.Msg.Elem.Text($('#sendMsg').val());
                msg.addText(text_obj);
            }
        }
        msg.sending = 1;
        msg.originContent = $('#sendMsg').val();

        webim.sendMsg(msg, function(resp) {
            if (msg.sess.type() == 'C2C') {
                msgListShow(msg);
            }
            $('#sendMsg').val('')
        }, function(err) {
            //showReSend(msg);
        });
    }

})

function onAppliedDownloadUrl(data) {
    console.debug(data);
}

//显示表情列表

function showFace() {
    if (emotionFlag) {
        $('.showFace').show();
        return;
    }
    emotionFlag = true;

    for (var index in webim.Emotions) {
        var emotions = $('<img>').attr({
            "id": webim.Emotions[index][0],
            "src": webim.Emotions[index][1],
            "style": "cursor:pointer;"
        }).click(function() {
            selectEmotionImg(this);
        });
        $('<li>').append(emotions).appendTo($('#emotionUL'));
    }
    $('.showFace').show();
}

//表情选择div的关闭方法
var turnoffFaces_box = function() {
    $("#wl_faces_box").fadeOut("slow");
};
//选中表情
var selectEmotionImg = function(selImg) {
    $('.showFace').hide();
    if ($('#sendMsg').val() == '') {
        $('#sendMsg').val(selImg.id)
    } else {
        $('#sendMsg').val($('#sendMsg').val() + selImg.id);
    }
    $('#sendMsg').focus();
};

function chioceImg() {
    $('#upd_pic').show();
    $('#upd_pic').attr('up', 'true');
    $('#sendMsg').attr("placeholder", '点击此处上传文件');
}

function chioceFile() {
    $('#upd_file').show();
    $('#upd_file').attr('up', 'true');
    $('#sendMsg').attr("placeholder", '点击此处上传文件');
}

//上传文件

function uploadFile() {
    var uploadFiles = document.getElementById('upd_file');
    var file = uploadFiles.files[0];
    //先检查图片类型和大小
    if (!checkFile(file)) {
        return;
    }
    var businessType; //业务类型，1-发群文件，2-向好友发文件
    if (selType == webim.SESSION_TYPE.C2C) { //向好友发文件
        businessType = webim.UPLOAD_PIC_BUSSINESS_TYPE.C2C_MSG;
    } else if (selType == webim.SESSION_TYPE.GROUP) { //发群文件
        businessType = webim.UPLOAD_PIC_BUSSINESS_TYPE.GROUP_MSG;
    }

    //封装上传文件请求
    var opt = {
        'file': file, //文件对象
        'To_Account': msgSendId, //接收者
        'businessType': businessType, //业务类型
        'fileType': webim.UPLOAD_RES_TYPE.FILE //表示上传文件
    };
    //上传文件
    webim.uploadFile(opt,
        function(resp) {
            //上传成功发送文件
            sendFile(resp, file.name);
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );
}

//发送文件消息

function sendFile(file, fileName) {
    if (!msgSendId) {
        alert("您还没有好友，暂不能聊天");
        return;
    }

    if (!selSess) {
        var selSess = new webim.Session(selType, msgSendId, msgSendId, masSendUrl, Math.round(new Date().getTime() / 1000));
    }
    var msg = new webim.Msg(selSess, true, -1, -1, -1, loginInfo.identifier, 0, loginInfo.identifierNick);
    var uuid = file.File_UUID; //文件UUID
    var fileSize = file.File_Size; //文件大小
    var senderId = loginInfo.identifier;
    var downloadFlag = file.Download_Flag;
    if (!fileName) {
        var random = Math.round(Math.random() * 4294967296);
        fileName = random.toString();
    }
    var fileObj = new webim.Msg.Elem.File(uuid, fileName, fileSize, senderId, msgSendId, downloadFlag, selType);
    msg.addFile(fileObj);
    //调用发送文件消息接口
    webim.sendMsg(msg, function(resp) {
        if (selType == webim.SESSION_TYPE.C2C) { //私聊时，在聊天窗口手动添加一条发的消息，群聊时，长轮询接口会返回自己发的消息
            $('#upd_file').val('');
            $('#upd_file').hide();
            $('#upd_file').attr('up', 'false');
            $('#sendMsg').attr("placeholder", '');
            msgListShow(msg);
        } else {
            $('#upd_file').val('');
            $('#upd_file').hide();
            $('#upd_file').attr('up', 'false');
            $('#sendMsg').attr("placeholder", '');
        }
    }, function(err) {
        alert(err.ErrorInfo);
    });
}

//检查文件类型和大小

function checkFile(file) {
    fileSize = Math.round(file.size / 1024 * 100) / 100; //单位为KB
    if (fileSize > 20 * 1024) {
        alert("您选择的文件大小超过限制(最大为20M)，请重新选择");
        return false;
    }
    return true;
}

//上传图片

function uploadPic() {
    var uploadFiles = document.getElementById('upd_pic');
    var file = uploadFiles.files[0];
    var businessType; //业务类型，1-发群图片，2-向好友发图片
    if (selType == webim.SESSION_TYPE.C2C) { //向好友发图片
        businessType = webim.UPLOAD_PIC_BUSSINESS_TYPE.C2C_MSG;
    } else if (selType == webim.SESSION_TYPE.GROUP) { //发群图片
        businessType = webim.UPLOAD_PIC_BUSSINESS_TYPE.GROUP_MSG;
    }
    //封装上传图片请求
    var opt = {
        'file': file, //图片对象
        'To_Account': msgSendId, //接收者
        'businessType': businessType //业务类型
    };
    //上传图片
    webim.uploadPic(opt,
        function(resp) {
            //上传成功发送图片
            sendPic(resp, file.name);
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );
}

//发送图片消息

function sendPic(images, imgName) {
    if (!msgSendId) {
        alert("您还没有好友，暂不能聊天");
        return;
    }

    if (!selSess) {
        var selSess = new webim.Session(selType, msgSendId, msgSendId, masSendUrl, Math.round(new Date().getTime() / 1000));
    }
    var msg = new webim.Msg(selSess, true, -1, -1, -1, loginInfo.identifier, 0, loginInfo.identifierNick);
    var images_obj = new webim.Msg.Elem.Images(images.File_UUID);
    for (var i in images.URL_INFO) {
        var img = images.URL_INFO[i];
        var newImg;
        var type;
        switch (img.PIC_TYPE) {
            case 1: //原图
                type = 1; //原图
                break;
            case 2: //小图（缩略图）
                type = 3; //小图
                break;
            case 4: //大图
                type = 2; //大图
                break;
        }
        newImg = new webim.Msg.Elem.Images.Image(type, img.PIC_Size, img.PIC_Width, img.PIC_Height, img.DownUrl);
        images_obj.addImage(newImg);
    }
    msg.addImage(images_obj);

    //调用发送图片消息接口
    webim.sendMsg(msg, function(resp) {
        if (selType == webim.SESSION_TYPE.C2C) { //私聊时，在聊天窗口手动添加一条发的消息，群聊时，长轮询接口会返回自己发的消息
            $('#upd_pic').val('');
            $('#upd_pic').hide();
            $('#upd_pic').attr('up', 'false');
            $('#sendMsg').attr("placeholder", '');
            msgListShow(msg);
        } else {
            $('#upd_pic').val('');
            $('#upd_pic').hide();
            $('#upd_pic').attr('up', 'false');
            $('#sendMsg').attr("placeholder", '');
        }
    }, function(err) {
        alert(err.ErrorInfo);
    });
}
//检查文件类型和大小

function checkPic(obj, fileSize) {
    var picExts = 'jpg|jpeg|png|bmp|gif|webp';
    var photoExt = obj.value.substr(obj.value.lastIndexOf(".") + 1).toLowerCase(); //获得文件后缀名
    var pos = picExts.indexOf(photoExt);
    if (pos < 0) {
        alert("您选中的文件不是图片，请重新选择");
        return false;
    }
    fileSize = Math.round(fileSize / 1024 * 100) / 100; //单位为KB
    if (fileSize > 30 * 1024) {
        alert("您选择的图片大小超过限制(最大为30M)，请重新选择");
        return false;
    }
    return true;
}

//查看个人资料
$('.setting_userInfor').click(function() {
    $('.personalProfile').show();
    $('.personalInfo').show();
    $('.conetet').hide();
    var pram = {
        "To_Account": [loginInfo.identifier],
        "TagList": [
            "Tag_Profile_IM_Nick",
            "Tag_Profile_IM_Image",
            "Tag_Profile_IM_Gender",
            "Tag_Profile_IM_AllowType"
        ]
    }
    webim.getProfilePortrait(pram, function(resp) {
        var userDate = resp.UserProfileItem[0].ProfileItem;
        for (var i in userDate) {
            switch (userDate[i].Tag) {
                case "Tag_Profile_IM_Nick":
                    nick = userDate[i].Value;
                    break;
                case 'Tag_Profile_IM_Gender':
                    gender = userDate[i].Value;
                    break;
                case 'Tag_Profile_IM_AllowType':
                    allowType = userDate[i].Value;
                    break;
                case 'Tag_Profile_IM_Image':
                    image = userDate[i].Value;
                    break;
            }
        }
        $("#personalUrl").val(image);
        $("#personalName").val(nick);
        var sexGender = $('#sexGender').children();
        for (var i = 0; i < sexGender.length; i++) {
            if (sexGender[i].value == gender) {
                sexGender[i].checked = true;
                break;
            }
        }
        var addSettingAll = $('#allowTypeChoice').children();
        for (var i = 0; i < addSettingAll.length; i++) {
            if (addSettingAll[i].value == allowType) {
                addSettingAll[i].checked = true;
                break;
            }
        }
    })
})

//修改个人资料
$('#upProfile').click(function() {
    var image = $("#personalUrl").val();

    if ($("#personalName").val().length == 0) {
        alert('请输入昵称');
        return;
    }
    if (webim.Tool.trimStr($("#personalName").val()).length == 0) {
        alert('您输入的昵称全是空格,请重新输入');
        return;
    }
    var gender = $('input[name="sex"]:checked').val();
    if (!gender) {
        alert('请选择性别');
        return;
    }
    var profile_item = [{
        "Tag": "Tag_Profile_IM_Nick",
        "Value": $("#personalName").val()
    }, {
        "Tag": "Tag_Profile_IM_Gender",
        "Value": gender
    }, {
        "Tag": "Tag_Profile_IM_AllowType",
        "Value": $('input[name="addSetting"]:checked').val()
    }];
    if (image) { //如果设置了头像URL
        profile_item.push({
            "Tag": "Tag_Profile_IM_Image",
            "Value": image
        });
    }
    var options = {
        'ProfileItem': profile_item
    };

    webim.setProfilePortrait(
        options,
        function(resp) {
            alert('修改资料成功');
            $('.conetet').show();
            $('.personalProfile').hide();
            loginInfo.identifierNick = $("#personalName").val(); //更新昵称
            document.getElementById("t_my_name").innerHTML = webim.Tool.formatText2Html(loginInfo.identifierNick);
            loginInfo.headurl = $("#personalUrl").val(); //更新昵称
            document.getElementById("userImg").src = loginInfo.headurl;
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );
})

//查看群组资料

function selectGroup(id) {
    $('.personalProfile').show();
    $('.groupInfo').show();
    $('.moreList').hide();
    $('.friend_list_more').remove();
    var optionsG = {
        'GroupIdList': [id],
        "GroupBaseInfoFilter": [ // 如果基础信息字段，请在此数组中添加
            "Type",
            "Name",
            "Introduction",
            "Notification",
            "FaceUrl"
        ]
    };
    webim.getGroupInfo(
        optionsG,
        function(resp) {
            var dataGroup = resp.GroupInfo[0];
            $('#groupInfo').attr('groupId', dataGroup.GroupId);
            $('#groupInfo').attr('groupType', dataGroup.Type);
            $('#upGroupName').val(dataGroup.Name);
            $('#upGroupUrl').val(dataGroup.FaceUrl);
            $('#groupNoticeUp').val(dataGroup.Notification);
            $('#groupIntroUp').val(dataGroup.Introduction);
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );
}

//修改群组资料
$('#upGroup').click(function() {
    var faceurl = $("#upGroupUrl").val();
    if ($("#upGroupName").val().length == 0) {
        alert('请输入群组名称');
        return;
    }
    if (webim.Tool.trimStr($("#upGroupName").val()).length == 0) {
        alert('您输入的群组名称全是空格,请重新输入');
        return;
    }
    if (webim.Tool.getStrBytes($("#fsm_name").val()) > 30) {
        alert('您输入的群组名称超出限制(最长10个汉字)');
        return;
    }
    if (webim.Tool.getStrBytes($("#groupNoticeUp").val()) > 150) {
        alert('您输入的群组公告超出限制(最长50个汉字)');
        return;
    }
    if (webim.Tool.getStrBytes($("#groupIntroUp").val()) > 120) {
        alert('您输入的群组简介超出限制(最长40个汉字)');
        return;
    }
    var options = {
        'GroupId': $('#groupInfo').attr('groupId'),
        'Name': $('#upGroupName').val(),
        'Notification': $('#groupNoticeUp').val(),
        'Introduction': $('#groupIntroUp').val()
    };
    if (faceurl) {
        options.FaceUrl = faceurl;
    }
    webim.modifyGroupBaseInfo(
        options,
        function(resp) {
            alert('修改群资料成功');
            $('.personalProfile').hide();
            $('.groupInfo').hide();
            $('.moreList').show();
            var options = {
                'Member_Account': loginInfo.identifier,
                'Offset': 0,
                "GroupType": $('#groupInfo').attr('groupType'),
                "GroupBaseInfoFilter": [ // 需要哪些基础信息字段
                    "Name",
                    "FaceUrl"
                ]
            };

            webim.getJoinedGroupListHigh(
                options,
                function(resp) {
                    moreList(resp.GroupIdList)
                }
            );
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );
})

//向上翻页，获取更早的好友历史消息
var getPrePageC2CHistoryMsgs = function() {
    if (selType == webim.SESSION_TYPE.GROUP) {
        alert('当前的聊天类型为群聊天，不能进行拉取好友历史消息操作');
        return;
    }
    var tempInfo = getPrePageC2CHistroyMsgInfoMap[msgShowID]; //获取下一次拉取的c2c消息时间和消息Key
    var lastMsgTime;
    var msgKey;
    if (tempInfo) {
        lastMsgTime = tempInfo.LastMsgTime;
        msgKey = tempInfo.MsgKey;
    } else {
        alert('获取下一次拉取的c2c消息时间和消息Key为空');
        return;
    }
    var options = {
        'Peer_Account': msgShowID, //好友帐号
        'MaxCnt': 15, //拉取消息条数
        'LastMsgTime': lastMsgTime, //最近的消息时间，即从这个时间点向前拉取历史消息
        'MsgKey': msgKey
    };
    webim.getC2CHistoryMsgs(
        options,
        function(resp) {
            var complete = resp.Complete; //是否还有历史消息可以拉取，1-表示没有，0-表示有
            if (resp.MsgList.length == 0) {
                webim.Log.warn("没有历史消息了:data=" + JSON.stringify(options));
                return;
            }
            getPrePageC2CHistroyMsgInfoMap[msgShowID] = { //保留服务器返回的最近消息时间和消息Key,用于下次向前拉取历史消息
                'LastMsgTime': resp.LastMsgTime,
                'MsgKey': resp.MsgKey
            };
            getHistoryMsgCallback(resp.MsgList, true);
        },
    );
};

//向上翻页，获取更早的群历史消息
var getPrePageGroupHistoryMsgs = function() {
    if (selType == webim.SESSION_TYPE.C2C) {
        alert('当前的聊天类型为好友聊天，不能进行拉取群历史消息操作');
        return;
    }
    var tempInfo = getPrePageGroupHistroyMsgInfoMap[msgShowID]; //获取下一次拉取的群消息seq
    var reqMsgSeq;
    if (tempInfo) {
        reqMsgSeq = tempInfo.ReqMsgSeq;
        if (reqMsgSeq <= 0) {
            webim.Log.warn('该群没有历史消息可拉取了');
            return;
        }
    } else {
        webim.Log.error('获取下一次拉取的群消息seq为空');
        return;
    }
    var options = {
        'GroupId': msgShowID,
        'ReqMsgSeq': reqMsgSeq,
        'ReqMsgNumber': 15
    };

    webim.syncGroupMsgs(
        options,
        function(msgList) {
            if (msgList.length == 0) {
                webim.Log.warn("该群没有历史消息了:options=" + JSON.stringify(options));
                return;
            }
            var msgSeq = msgList[0].seq - 1;
            getPrePageGroupHistroyMsgInfoMap[msgShowID] = {
                "ReqMsgSeq": msgSeq
            };

            getHistoryMsgCallback(msgList, true);
        },
        function(err) {
            alert(err.ErrorInfo);
        }
    );
};

//msgList 为消息数组，结构为[Msg]

function getHistoryMsgCallback(msgList, prepage) {
    var msg;
    prepage = prepage || false;

    //如果是加载前几页的消息，消息体需要prepend，所以先倒排一下
    if (prepage) {
        msgList.reverse();
    }

    for (var i = 0; i < infoMap.length; i++) {
        for (var j = 0; j < msgList.length; j++) {
            if (infoMap[i].id == msgList[j].fromAccount) {
                msgList[j].accountImg = infoMap[i].image
            }
        }
    }

    for (var j in msgList) { //遍历新消息
        msg = msgList[j];
        if (msg.getSession().id() == msgShowID) { //为当前聊天对象的消息
            selSess = msg.getSession();
            //在聊天窗体中新增一条消息
            msgListShow(msg, prepage);
        }
    }
    //消息已读上报，并将当前会话的消息设置成自动已读
    webim.setAutoRead(selSess, true, true);
}

// //消息删除

// function msgRomver() {
//     $(this).remove();
// }