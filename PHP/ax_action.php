<?php
session_start();

if ( ! isset($_SESSION['vs_cloud_username']) or
	empty($_SESSION['vs_cloud_username']) ) {
	session_unset();
        session_destroy();
	exit();
}


if ( empty($_POST['action']) ) exit();
if ( empty($_POST['arg']) ) exit();

if ( $_POST['action'] == "display" ) {
	$_SESSION['displayInfo'] = $_POST['arg'];
        unset($_SESSION['cached_user_credit']);
	exit();
}

require './vs_cloud_functions.php';

$vs_fld = $_POST['arg'];


if ( $_POST['action'] == "create" ) {
	$cred=getUsedCredit();
	$cost=getCachedAttrib($vs_fld,"VST_COST");
	run_local_command("/ctl/create $vs_fld " . $_SESSION['vs_cloud_username']);
	$_SESSION['displayInfo'] = "vs_table";
	setUsedCredit($cred + $cost);
	for($x=1;$x<=25;$x++) {
          clearCachedAttrib($vs_fld,"CUSTOM_ACCESS" . $x . "_DESC");
          clearCachedAttrib($vs_fld,"CUSTOM_ACCESS" . $x . "_ENABLED_DISABLED");
          clearCachedAttrib($vs_fld,"CUSTOM_ACCESS" . $x . "_PASS");
	}
	exit();
}




// next actions are allowed only for a owned VS or for admins, the argument is the VS/VST folder name

if ( ! isVSowner($vs_fld, $_SESSION['vs_cloud_username']) and ! $_SESSION['vs_cloud_isAdmin']) exit();


if ( $_POST['action'] == "start" ) {
	//clearCachedAttrib($vs_fld,"SSH_ACCESS"); // OLD COMPAT
	run_local_command("/ctl/start $vs_fld");
	$cred=getUsedCredit();
	$cost=getCachedAttrib($vs_fld,"VST_COST");
	setUsedCredit($cred + $cost);
	for($x=1;$x<=25;$x++) {
          clearCachedAttrib($vs_fld,"CUSTOM_ACCESS" . $x . "_DESC");
          clearCachedAttrib($vs_fld,"CUSTOM_ACCESS" . $x . "_ENABLED_DISABLED");
          clearCachedAttrib($vs_fld,"CUSTOM_ACCESS" . $x . "_PASS");
	}
        clearCachedAttrib($vs_fld,"VS_DTR");
	exit();
}

// CREDIT ISSUE IF THE VS IS STOPPED FROM WITHIN THE GUEST
if ( $_POST['action'] == "stop" ) {
	clearCachedAttrib($vs_fld,"SSH_ACCESS"); // OLD COMPAT
	run_local_command("/ctl/stop $vs_fld");
	$cred=getUsedCredit();
	$cost=getCachedAttrib($vs_fld,"VST_COST");
	setUsedCredit($cred - $cost);
	exit();
}

if ( $_POST['action'] == "reset_dtr" ) {
	$node = get_best_node($vs_fld);
	if ( ! empty($node)) {
		clearCachedAttrib($vs_fld,"VS_DTR");
		runRemCommBg($node, $vs_fld, "setInfo VS_DTR 30");
		$_SESSION['displayInfo'] = "vs_details_" . $vs_fld;
	}
	exit();
}

if ( $_POST['action'] == "report_issue" ) {
	$node = get_best_node($vs_fld);
	if ( ! empty($node)) {
		$userdata = base64_encode($_POST['userdata']);
		runRemCommBg($node, $vs_fld, "setInfo VS_REPORT_ISSUE64 $userdata");
		$_SESSION['displayInfo'] = "vs_details_" . $vs_fld;
	}
	exit();
}


if ( $_POST['action'] == "delete" ) {
	$cred=getUsedCredit();
	$cost=getCachedAttrib($vs_fld,"VST_COST");
	run_local_command("/ctl/delete $vs_fld");

	$_SESSION['displayInfo'] = "vs_table";
	// remove cached attributes
	clearCachedAttrib($vs_fld,"VST_NAME");
	clearCachedAttrib($vs_fld,"VS_NAME");
	clearCachedAttrib($vs_fld,"VST_DESC");
	clearCachedAttrib($vs_fld,"VS_DESC");
	clearCachedAttrib($vs_fld,"VST_COST");
	clearCachedAttrib($vs_fld,"VS_DTR");
	clearCachedAttrib($vs_fld,"VS_FIXED_HOST");

	## CUSTOM_ACCESS attributes
	for($x=1;$x<=25;$x++) {
          clearCachedAttrib($vs_fld,"CUSTOM_ACCESS" . $x . "_DESC");
          clearCachedAttrib($vs_fld,"CUSTOM_ACCESS" . $x . "_PASS");
          clearCachedAttrib($vs_fld,"CUSTOM_ACCESS" . $x . "_PASS_CHANGE");
          clearCachedAttrib($vs_fld,"CUSTOM_ACCESS" . $x . "_ENABLED_DISABLED");
          clearCachedAttrib($vs_fld,"CUSTOM_ACCESS" . $x . "_DESC_DISABLED"); // discontinued
	}

	// BELOW ATTRIBUTES ARE OLD AND TO BE REMOVED
	clearCachedAttrib($vs_fld,"VNC_ACCESS");
	clearCachedAttrib($vs_fld,"VNC_PASS");
	clearCachedAttrib($vs_fld,"LX_ROOT_PASS");
	clearCachedAttrib($vs_fld,"SSH_ACCESS");
	clearCachedAttrib($vs_fld,"SSH_PASS");
	clearCachedAttrib($vs_fld,"CUSTOM_SHELLINABOX");
	clearCachedAttrib($vs_fld,"CUSTOM_SHELLINABOX_DIRECT");
	setUsedCredit($cred - $cost);
	exit();
}


if ( $_POST['action'] == "rename" ) {
	$node = get_best_node($vs_fld);
	$userdata = base64_encode($_POST['userdata']);
	if ( ! empty($node)) {
		if (substr($vs_fld,0,4) == "VST_") {
			// if ( ! $_SESSION['vs_cloud_isAdmin']) exit();
			runRemCommBg($node, $vs_fld, "setInfo VST_NAME64 $userdata");
			clearCachedAttrib($vs_fld,"VST_NAME");
		}
		else {
			runRemCommBg($node, $vs_fld, "setInfo VS_NAME64 $userdata");
			clearCachedAttrib($vs_fld,"VS_NAME");
		}
		$_SESSION['displayInfo'] = "vs_details_" . $vs_fld;
	}
	exit();
}



if ( $_POST['action'] == "editdesc" ) {
	$node = get_best_node($vs_fld);
	if ( ! empty($node)) {
		$userdata = base64_encode($_POST['userdata']);
		if (substr($vs_fld,0,4) == "VST_") { 
			// if ( ! $_SESSION['vs_cloud_isAdmin']) exit();
			runRemCommBg($node, $vs_fld, "setInfo VST_DESC64 $userdata");
			clearCachedAttrib($vs_fld,"VST_DESC");
		}
		else {
			runRemCommBg($node, $vs_fld, "setInfo VS_DESC64 $userdata");
			clearCachedAttrib($vs_fld,"VS_DESC");
		}
		$_SESSION['displayInfo'] = "vs_details_" . $vs_fld;
	}
	exit();
}


### TODO - remove, not used any more
if ( $_POST['action'] == "setVNCpass" ) {
	$node = get_best_node($vs_fld);
	if ( ! empty($node)) {
		$userdata = base64_encode($_POST['userdata']);
		runRemCommBg($node, $vs_fld, "setInfo VNC_PASS64 $userdata");
		clearCachedAttrib($vs_fld,"VNC_PASS");
		$_SESSION['displayInfo'] = "vs_details_" . $vs_fld;
	}
	exit();
}


### TODO - remove not used any more
if ( $_POST['action'] == "setSSHpass" ) {
	$node = get_best_node($vs_fld);
	if ( ! empty($node)) {
		$userdata = base64_encode($_POST['userdata']);
		runRemCommBg($node, $vs_fld, "setInfo SSH_PASS64 $userdata");
		clearCachedAttrib($vs_fld,"SSH_PASS");
		$_SESSION['displayInfo'] = "vs_details_" . $vs_fld;
	}
	exit();
}


### TODO - supported only for old VMs, not used any more
if ( $_POST['action'] == "enableShellInaBoxDirect" ) {
	$node = get_best_node($vs_fld);
	if ( ! empty($node)) {
		runRemCommBg($node, $vs_fld, "setInfo CUSTOM_SHELLINABOX_DIRECT enable");
		clearCachedAttrib($vs_fld,"CUSTOM_SHELLINABOX_DIRECT");
		$_SESSION['displayInfo'] = "vs_details_" . $vs_fld;
	}
	exit();
}

### TODO - supported only for old VMs, not used any more
if ( $_POST['action'] == "disableShellInaBoxDirect" ) {
	$node = get_best_node($vs_fld);
	if ( ! empty($node)) {
		runRemCommBg($node, $vs_fld, "setInfo CUSTOM_SHELLINABOX_DIRECT disable");
		clearCachedAttrib($vs_fld,"CUSTOM_SHELLINABOX_DIRECT");
		$_SESSION['displayInfo'] = "vs_details_" . $vs_fld;
	}
	exit();
}





//// DISABLE A CUSTOM ACCESS
if ( substr($_POST['action'],0,19)  == "disableCustomAccess" ) {
	$node = get_best_node($vs_fld);
	if ( ! empty($node)) {
		$attr_name="CUSTOM_ACCESS" . substr($_POST['action'],19) . "_ENABLED_DISABLED";
		runRemCommBg($node, $vs_fld, "setInfo " . $attr_name . " disabled");
		clearCachedAttrib($vs_fld,$attr_name);
		$attr_name="CUSTOM_ACCESS" . substr($_POST['action'],19) . "_DESC";
		clearCachedAttrib($vs_fld,$attr_name);
		$attr_name="CUSTOM_ACCESS" . substr($_POST['action'],19) . "_DESC_DISABLED"; // discontinued
		clearCachedAttrib($vs_fld,$attr_name);
		$attr_name="CUSTOM_ACCESS" . substr($_POST['action'],19) . "_PASS";
		clearCachedAttrib($vs_fld,$attr_name);
		$_SESSION['displayInfo'] = "vs_details_" . $vs_fld;
	}
	exit();
}

//// ENABLE A CUSTOM ACCESS
if ( substr($_POST['action'],0,18)  == "enableCustomAccess" ) {
	$node = get_best_node($vs_fld);
	if ( ! empty($node)) {
		$attr_name="CUSTOM_ACCESS" . substr($_POST['action'],18) . "_ENABLED_DISABLED";
		runRemCommBg($node, $vs_fld, "setInfo " . $attr_name . " enabled");
		clearCachedAttrib($vs_fld,$attr_name);
		$attr_name="CUSTOM_ACCESS" . substr($_POST['action'],18) . "_DESC";
		clearCachedAttrib($vs_fld,$attr_name);
		$attr_name="CUSTOM_ACCESS" . substr($_POST['action'],18) . "_DESC_DISABLED"; // discontinued
		clearCachedAttrib($vs_fld,$attr_name);
		$attr_name="CUSTOM_ACCESS" . substr($_POST['action'],18) . "_PASS";
		clearCachedAttrib($vs_fld,$attr_name);
		$_SESSION['displayInfo'] = "vs_details_" . $vs_fld;
	}
	exit();
}


//// CHANGE A PASSWORD FOR A CUSTOM ACCESS - CUSTOM_ACCESS{N}_PASS
if ( substr($_POST['action'],0,13)  == "setCustomPass" ) {
	$node = get_best_node($vs_fld);
	if ( ! empty($node)) {
		$userdata = base64_encode($_POST['userdata']);
		$attr_name="CUSTOM_ACCESS" . substr($_POST['action'],13) . "_PASS";
		runRemCommBg($node, $vs_fld, "setInfo " . $attr_name . "64 " . $userdata);
		clearCachedAttrib($vs_fld,$attr_name);
		$_SESSION['displayInfo'] = "vs_details_" . $vs_fld;
	}
	exit();
}






// Following actions are for admins only

if ( ! $_SESSION['vs_cloud_isAdmin']) exit();


if ( $_POST['action'] == "disable" ) {
	if (substr($vs_fld,0,4) == "VST_") {
		$node = get_best_node($vs_fld);
		if ( ! empty($node)) {
			runRemCommBg($node, $vs_fld, "setInfo VST_DISABLED YES" );
		}
	}
	exit();
}


if ( $_POST['action'] == "rawsetinfo" ) {
	$node = get_best_node($vs_fld);
	runRemCommBg($node, $vs_fld,"setInfo " . $_POST['userdata']);
	$_SESSION['displayInfo'] = "vs_details_" . $vs_fld;
        exit();
}



if ( $_POST['action'] == "enable" ) {
	if (substr($vs_fld,0,4) == "VST_") {
		$node = get_best_node($vs_fld);
		if ( ! empty($node)) {
			runRemCommBg($node, $vs_fld, "setInfo VST_DISABLED NO" );
		}
	}
	exit();
}


//// END
