require('dotenv').config();

module.exports = {
    url: process.env.LDAP_URL || 'ldap://192.168.62.4',
    baseDN: process.env.LDAP_BASE_DN || 'ou=users,dc=dei,dc=isep,dc=ipp,dc=pt',
    userAttr: process.env.LDAP_USER_ATTR || 'uid',
    timeout: parseInt(process.env.LDAP_TIMEOUT) || 5000
};