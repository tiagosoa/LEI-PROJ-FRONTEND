<?php
session_start();

if ( ! isset($_SESSION['vs_cloud_username']) or
	empty($_SESSION['vs_cloud_username']) ) {
	echo "<h2>Session expired, please login again</h2>";
	session_unset();
        session_destroy();
	echo "<input type=button value=\"LOGIN AGAIN\" \
				onClick=\"window.location.replace(window.location.href);\">";
	exit();
}

if ( ! isset($_SESSION['displayInfo'])) {
	//if( isset($_SESSION['vs_cloud_isAdmin']) and $_SESSION['vs_cloud_isAdmin']) $_SESSION['displayInfo']="vs_table_admin"; // initial screen for admins is all vs table
	//else $_SESSION['displayInfo']="vs_table";
	$_SESSION['displayInfo']="vs_table";
	}
$displayInfo=$_SESSION['displayInfo'];

require './vs_cloud_functions.php';
require './vs_display_functions.php';

$admin_colour="#FFFFE0";
##$user_colour="#E0FFE0";
$user_colour="#E0E0E0";

$new_content="";


/// if user has a special role, then credit is 10000

#$user_total_credit = getUserCredit();
#$used_credit = getUsedCredit();
#if ( ! is_numeric($user_total_credit)) $user_total_credit = 10000;
#else $user_total_credit = intval($user_total_credit);

############ OWNED VS LIST

if ( $displayInfo == "vs_table" ) $new_content=buildHtmlVStable();

############ SHOW ALL VS LIST (administrators only)

else
if ( $displayInfo == "vs_table_admin" and $_SESSION['vs_cloud_isAdmin']) $new_content = buildHtmlVStableALL();

############ SHOW AND MANAGE VST LIST (administrators only)

else
if ( $displayInfo == "vst_table_admin" and $_SESSION['vs_cloud_isAdmin']) $new_content = buildHtmlVSTtableALL();

############ SHOW TEMPLATES TABLE USERS USE CASE

else
if ( $displayInfo == "vst_table" ) $new_content = buildHtmlVSTtable();

############ SHOW A VS/VST DETAILS

else
if ( substr($displayInfo,0,11) == "vs_details_" ) $new_content = buildHtmlVSdetails(substr($displayInfo,11));

###################### SHOW RAW INFORMATION ON VS/VST (ADMINS)

else
if ( substr($displayInfo,0,11) == "vs_rawinfo_" ) $new_content = buildHtmlVSrawInfo(substr($displayInfo,11));

###################### RAW SETTING OF VS/VST ATTRIBUTE (ADMINS)

else
if ( substr($displayInfo,0,10) == "vs_setraw_" ) $new_content = buildHtmlVSsetRawAttribute(substr($displayInfo,10));

###################### SHOW CLUSTER STATUS (ADMINS)

else
if ( $displayInfo == "vs_cluster_status" and $_SESSION['vs_cloud_isAdmin']) $new_content = buildHtmlClusterStatus();

###################### SHOW NETWORK CONFIGURATION INFORMATION FOR VS/VST

else
if ( substr($displayInfo,0,13) == "vs_netconfig_" ) $new_content = buildHtmlVSnetConfig(substr($displayInfo,13));

###################### RENAME A VS OR VST USE CASE

else
if ( substr($displayInfo,0,10) == "vs_rename_" ) $new_content = buildHtmlVSrename(substr($displayInfo,10));

###################### DELETE A VS

else
if ( substr($displayInfo,0,10) == "vs_delete_" ) $new_content = buildHtmlVSdelete(substr($displayInfo,10));

###################### EDIT A VS OR VST DESCRIPTION USE CASE

else
if ( substr($displayInfo,0,12) == "vs_editdesc_" ) $new_content = buildHtmlVSeditDesc(substr($displayInfo,12));


###################### REPORT AN ISSUE USE CASE

else
if ( substr($displayInfo,0,16) == "vs_report_issue_" ) $new_content = buildHtmlVSreportIssue(substr($displayInfo,16));


// "vs_change_custom_pass_" . $x . "_" . $displayFld;
else
if ( substr($displayInfo,0,22) == "vs_change_custom_pass_" ) $new_content = buildHtmlVSchangeCustomPass(substr($displayInfo,22));

###################### CHANGE THE VNC PASSWORD

else
if ( substr($displayInfo,0,19) == "vs_change_VNC_pass_" ) $new_content = buildHtmlVSchangeVNCpass(substr($displayInfo,19));

###################### CHANGE THE SSH PASSWORD USE CASE

else
if ( substr($displayInfo,0,19) == "vs_change_SSH_pass_" ) $new_content = buildHtmlVSchangeSSHpass(substr($displayInfo,19));



####################################
#
#
if ( substr($_SERVER['REMOTE_ADDR'],0,3) != "10." and substr($_SERVER['REMOTE_ADDR'],0,11) != "192.168.62." ) {
	$new_content = "<table><tr><td bgcolor=#FFD000><small>WARNING: you are accessing this private cloud from an external IP address (" . $_SERVER['REMOTE_ADDR'] . "). This means that the only services provided by your Virtual Servers that you will be able to reach are those with external access.</small></td></tr></table>" . $new_content; 
}

###################### SEND RESPONSE

$new_content_hash = hash("md5", $new_content);

if ( isset($_POST['force']) and $_POST['force'] == "1") {
	$_SESSION['last_content_hash'] = $new_content_hash;
	echo "$new_content";
	exit();
}

if ( isset($_SESSION['last_content_hash']) and $_SESSION['last_content_hash'] == $new_content_hash ) {
	session_write_close();
	sleep(1);   // hold the response for one second
	echo "same";
}
else {
	$_SESSION['last_content_hash'] = $new_content_hash;
	echo "$new_content";
}


?>
