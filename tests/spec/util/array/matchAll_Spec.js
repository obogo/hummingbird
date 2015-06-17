hb.define('matchAllSpec', ['matchAll'], function (matchAll) {
    describe('matchAll', function () {
        it("should create a new array", function () {
            var ary = [0, 1, 2];
            var result = matchAll(ary, 3);
            expect(result.length).toBe(0);
        });

        it("should keep any items that match", function () {
            var ary = [0, 1, 2];
            var result = matchAll(ary, 2);
            expect(result).toEqual([2]);
        });

        it("should keep any items that match with objects", function () {
            var ary = [{id: 0}, {id: 1}, {id: 1}];
            var result = matchAll(ary, {id: 1});
            expect(result.length).toBe(2);
            expect(result[0].id).toBe(1);
            expect(result[1].id).toBe(1);
        });

        it("should match the following complex match", function () {
            var ary = [
                {
                    "options": {
                        "id": "chat",
                        "directive": "scChat",
                        "label": "",
                        "popup": true,
                        "status_delay": 5000,
                        "type_indicator": {
                            "show_device": false
                        },
                        "welcome": {
                            "enabled": true
                        },
                        "responder": {
                            "enabled": true
                        },
                        "composer": {
                            "attach": true,
                            "notes": true
                        },
                        "show_user_avatar": false
                    },
                    "linker": {
                        "scope": true,
                        "tplUrl": "8104a960_tpl39",
                        "link": [
                            "scope",
                            "el",
                            "attr",
                            "$app",
                            "clickOutside",
                            "conversationService",
                            "userService",
                            "translateService",
                            "configService",
                            "socketService",
                            "soundService",
                            null
                        ]
                    }
                },
                {
                    "options": {
                        "id": "inbox",
                        "directive": "scInbox",
                        "label": "",
                        "icon": "avatar",
                        "order": 0,
                        "showTab": true,
                        "showNewMessage": true
                    },
                    "linker": {
                        "scope": true,
                        "tplUrl": "8104a960_tpl40",
                        "link": [
                            "scope",
                            "el",
                            "$app",
                            "conversations",
                            "conversationService",
                            "socketService",
                            "userService",
                            "sc.events",
                            null
                        ]
                    }
                },
                {
                    "options": {
                        "id": "unassigned",
                        "directive": "scUnassigned",
                        "label": "",
                        "icon": "ion-chatbox",
                        "order": 1,
                        "adminOnly": true,
                        "showTab": true,
                        "showNewMessage": false,
                        "allowInPlan": [
                            "enterprise",
                            "pro",
                            "basic",
                            "trial"
                        ]
                    },
                    "linker": {
                        "scope": true,
                        "tplUrl": "8104a960_tpl40",
                        "link": [
                            "scope",
                            "el",
                            "$app",
                            "conversations",
                            "sc.events",
                            "socketService",
                            null
                        ]
                    }
                },
                {
                    "options": {
                        "id": "profile",
                        "directive": "scProfile",
                        "label": "",
                        "popup": true,
                        "user": null
                    },
                    "linker": {
                        "scope": true,
                        "tplUrl": "8104a960_tpl41",
                        "link": [
                            "scope",
                            "el",
                            "translateService",
                            "sc.events",
                            null
                        ]
                    }
                },
                {
                    "options": {
                        "id": "userForm",
                        "directive": "scUserForm",
                        "label": "",
                        "popup": true,
                        "firstName": "",
                        "lastName": "",
                        "email": ""
                    },
                    "linker": {
                        "scope": true,
                        "tplUrl": "8104a960_tpl42",
                        "link": [
                            "scope",
                            "el",
                            "userService",
                            "conversationService",
                            "translateService",
                            "socketService",
                            "sc.events",
                            null
                        ]
                    }
                },
                {
                    "options": {
                        "id": "admins",
                        "directive": "scAdmins",
                        "label": "",
                        "adminOnly": true,
                        "popup": true
                    },
                    "linker": {
                        "scope": true,
                        "tplUrl": "8104a960_tpl55",
                        "link": [
                            "scope",
                            "el",
                            "adminService",
                            "socketService",
                            "translateService",
                            "sc.events",
                            null
                        ]
                    }
                },
                {
                    "options": {
                        "id": "onlineUsers",
                        "directive": "scOnlineUsers",
                        "label": "",
                        "order": 2,
                        "icon": "ion-person",
                        "showTab": true
                    },
                    "linker": {
                        "scope": true,
                        "tplUrl": "8104a960_tpl57",
                        "link": [
                            "scope",
                            "el",
                            "translateService",
                            "socketService",
                            "conversationService",
                            "soundService",
                            "userService",
                            "sc.events",
                            null
                        ]
                    }
                },
                {
                    "options": {
                        "id": "login",
                        "directive": "scLogin",
                        "label": "",
                        "adminOnly": true,
                        "popup": true
                    },
                    "linker": {
                        "scope": true,
                        "tplUrl": "8104a960_tpl56",
                        "link": [
                            "scope",
                            "el",
                            "userService",
                            "translateService",
                            "adminService",
                            "sc.events",
                            null
                        ]
                    }
                }
            ];
            var result = matchAll(ary, {options:{allowInPlan:['trial']}});
            expect(result.length).toBe(1);
        });
    })
});