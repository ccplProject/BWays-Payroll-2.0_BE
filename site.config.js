module.exports = {
    "DEFAULT": {
        "private": {
            "DATABASE": {
                "USER_DB_SERVER": "192.168.1.207",
                "USER_DB_PORT": 10433,
                "USER_DB_USER": "sa",
                "USER_DB_PASSWORD": "Ccpl@7276",
                "USER_DB": "PARIKHM_20268"
            }
        },
        "URL": {
            "isDynamicUrl": false,
            "oldSiteUrl": "http://192.168.1.207/PayWebSite/Login.Aspx",
            "packages": [
                {
                    "code": 1,
                    "name": "BWays Payroll",
                    "shortSubtitle": "Human Resource & Payroll Management",
                    "icon": "fas fa-users-cog",
                    "bgColor": "bg-blue-50",
                    "textColor": "text-blue-600",
                    "action": "navigate",
                    "route": "/auth/login",
                    "is_enable": true
                }
            ]
        },
        "BWaysProductDetails": {
            "BWaysProduct": 1,
            "productName": "BWays Payroll"
        }
    }
};
