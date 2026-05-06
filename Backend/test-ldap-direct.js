const ldap = require('ldapjs');

const LDAP_URL = 'ldap://192.168.62.4';
const BASE_DN = 'ou=users,dc=dei,dc=isep,dc=ipp,dc=pt';
const USER_ATTR = 'uid';

// SUBSTITUIR com as tuas credenciais
const USERNAME = '1231246';
const PASSWORD = '11Julho2005cd';

const userDN = `${USER_ATTR}=${USERNAME},${BASE_DN}`;

console.log('Testing LDAP authentication...');
console.log(`URL: ${LDAP_URL}`);
console.log(`User DN: ${userDN}`);
console.log('---');

const client = ldap.createClient({ url: LDAP_URL });

client.on('error', (err) => {
    console.error('❌ LDAP Client Error:', err.message);
});

client.bind(userDN, PASSWORD, (err) => {
    if (err) {
        console.error('❌ LDAP bind failed:');
        console.error(`   Code: ${err.code}`);
        console.error(`   Name: ${err.name}`);
        console.error(`   Message: ${err.message}`);
    } else {
        console.log('✅ LDAP authentication SUCCESS!');
    }
    client.destroy();
});