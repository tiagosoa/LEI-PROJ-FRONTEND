<?php
session_start();

$ldap_server="192.168.62.4";
$ldap_version=3;
$ldap_user_attr="uid";
$ldap_users_dn="ou=users,dc=dei,dc=isep,dc=ipp,dc=pt";
$vs_cloud_base_dir="/vs_cloud";
?>

<html><head><title>DEI Virtual Servers Private Cloud</title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /></meta>
<link rel="shortcut icon" href="/favicon.ico">
<style>
input { font-size: 16px;}
a {text-decoration: none;color: blue;}
a:hover { background-color: blue;color: yellow;}
select { font-size: 16px;}
</style>
<script src="vs_cloud_functions.js"></script>
</head>
<?php
require './vs_cloud_functions.php';

if ( ! isset($_SESSION['vs_cloud_username']) or empty($_SESSION['vs_cloud_username'])) {
	if (! empty($_POST['username']) and ! empty($_POST['userpass'])) {

		// convert username to lowercase - IMPORTANT
		$username=strtolower($_POST['username']);

		$ldap = ldap_connect($ldap_server);
		ldap_set_option($ldap, LDAP_OPT_PROTOCOL_VERSION, $ldap_version);
		$udn = $ldap_user_attr . "=" . $username . "," . $ldap_users_dn;
		if (ldap_bind($ldap, $udn, $_POST['userpass'])) {
			$_SESSION['vs_cloud_username'] = $username;
			$_SESSION['vs_cloud_base_dir'] = $vs_cloud_base_dir;
			$_SESSION['vs_cloud_isAdmin'] = ( getUserCredit() == "admin");

		// todo - LDAP groups membership


		}
	}
}
else {
	if ( $_POST['__action'] == "logout" ) {
		$_SESSION['vs_cloud_username'] = ""; 
		session_unset();
		session_destroy();

	}
}

if ( ! isset($_SESSION['vs_cloud_username']) ) $username = "";
else $username = $_SESSION['vs_cloud_username'];


if ( !empty($username) ) {
	echo "<body bgcolor=#c0c0c0 onload=\"refreshDisplayVS('1');\">
		<font face=consolas><table border=0 width=100%><tr>
		<td align=left><div id=\"vs_err\"></div></td>
		<td align=right>
		DEI Virtual Servers Private Cloud - <b>$username</b> &nbsp;&nbsp;&nbsp;
		<input width=20 type=button value=LOGOUT
		onClick=\"submitActionForm('logout', window.location.href)\"></td></tr></table></font>";
}
else {
	echo "<body bgcolor=#c0c0c0><br><br><br><center><table width=500px border=1><tr><td bgcolor=#D0E0D0 align=center>
		<br><h2>DEI Virtual Servers Private Cloud</h2><br>";
}

?>

<form name=main method="post" autocomplete="off" target="_self">
<input type=hidden name=__action value="">
<?php
if ( empty($username) ) {
	echo "<p><font face=consolas size=+1>Username: ";
	echo "<input type=text name=username size=15 required value=\"\" autocomplete=off><br><br>";
	echo "Password: <input type=password name=userpass required size=15 value=\"\" autocomplete=new-password><br><br>";
	echo "&nbsp;&nbsp;&nbsp;<input type=submit value=LOGIN></p></font>";
	if ( !empty($_POST['username']) and $_POST['__action'] != "logout" ) {
		echo "<h3>Sorry, login failed</h3>";
		}
	echo "</form></td></tr>";
	echo "</table></center>";
	echo "</body></html>";
	exit();
}


/// Administrator
//if ( empty($_SESSION['vs_cloud_isAdmin']) ) { $_SESSION['vs_cloud_isAdmin'] = isAdministrator($username); }
//$isAdmin=$_SESSION['vs_cloud_isAdmin'];



echo "<center><table border=0 width=100% cellpadding=8><tr><td align=center bgcolor=#E0E0E0><font size=1>";
echo "<input type=button value=\"Your Virtual Servers (VS) and templates (VST)\" 
	onClick=\"reqAction('display','vs_table')\">&nbsp;&nbsp;&nbsp;
	<input type=button value=\"Available Virtual Server Templates (VST)\"
	onClick=\"reqAction('display','vst_table')\"></font></td>";

if ($_SESSION['vs_cloud_isAdmin']) {
	echo "<td align=center bgcolor=#FFFFE0><font size=1>
		<input type=button value=\"All Virtual Servers\" 
		onClick=\"reqAction('display','vs_table_admin')\">&nbsp;&nbsp;&nbsp;
		<input type=button value=\"Manage Virtual Server Templates\" 
		onClick=\"reqAction('display','vst_table_admin')\">&nbsp;&nbsp;&nbsp;
		<input type=button value=\"Cluster Status\" 
		onClick=\"reqAction('display','vs_cluster_status')\">
		</font></td>";
}

?>

</tr></table><br>
<div id="vs_display" style="overflow-y: scroll;height:85%;"></div>

</center></form></body></html>


