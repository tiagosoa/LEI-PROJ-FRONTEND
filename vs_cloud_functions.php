<?php
# some interface function rely on vs_cloud_base_dir global variable


# interface for local call to commands
# the command line must start by / refering to the vs_cloud_base_dir

function run_local_command($cmdLine) {
	$cpipe = popen($_SESSION['vs_cloud_base_dir'] . $cmdLine ,"r");
	$res="";
	if ($cpipe) {
		while (($line = fgets($cpipe)) !== false) {
			$res=$res . $line;
		}
		pclose($cpipe);
	}
	return trim($res);
}



# interface for local call to command ctl/listFolders - returns an array
function get_fld_list($list_arg) {
	$list=array();
	$cpipe = popen($_SESSION['vs_cloud_base_dir'] . "/ctl/listFolders $list_arg" ,"r");

	if ($cpipe) {
        	while (($line = fgets($cpipe)) !== false) {
                	array_push($list, trim($line));
                	}
		pclose($cpipe);
	}
	return $list;
}


# interface for local call to command ctl/listNodes - returns an array - todo: could be cached
function get_nodes_list() {

	// run_local_command("/ctl/checkNodesStatus"); // STATUS REFRESH
	$list=array();
	$cpipe = popen($_SESSION['vs_cloud_base_dir'] . "/ctl/listNodes" ,"r");
	if ($cpipe) {
        	while (($line = fgets($cpipe)) !== false) {
                	array_push($list, trim($line));
                	}
		pclose($cpipe);
	}
	return $list;
}



# interface for local call to command ctl/getBestNode - todo : should check if available: get_node_info($vs_node, "load")

function get_best_node($vs_fld) {
	$node = get_vs_info($vs_fld, "VS_HOST");
	if( ! empty($node) ) return $node;
	$node = getCachedAttrib($vs_fld, "VS_FIXED_HOST");
	if( ! empty($node) ) return $node;
	$type = getVStype($vs_fld);
	return run_local_command("/ctl/getBestNode $type");
}



# interface for local get of a node status 
function get_node_info($vs_node, $vs_data) {
	$a_file = fopen("/var/www/vs_nodes_status/" . $vs_node . ".$vs_data" ,"r");
	$res="";
	if ($a_file) {
		$line = fgets($a_file);
		if ( $line != false) $res=$line;
		fclose($a_file);
		}
	return trim($res);
}



# interface for local get of VS/VST attribute
function get_vs_info($vs_fld, $vs_attrib) {
	$a_filename = $_SESSION['vs_cloud_base_dir'] . "/" . $vs_fld . "/.attr/$vs_attrib";
	if (file_exists ( $a_filename )) {
		$a_file = fopen($a_filename ,"r");
		if ($a_file) {
			$res="";
			while (($line = fgets($a_file)) !== false) {
				$res=$res . $line;
			}
			fclose($a_file);
			return trim($res);
		}
	}
	// fallback to getInfo command
	return run_local_command("/" . $vs_fld . "/getInfo $vs_attrib");
}


// get the VS hard status
function get_vs_hard_status($vs_fld, $node) {
	return runRemComm($node,$vs_fld,"isRunning");
}



# interface for REMOTE call to the VS/VST command getInfo
#
function get_vs_info_node($vs_fld, $vs_attrib) {
	$node = get_best_node($vs_fld);
	if ( ! empty($node)) {
		return runRemComm($node,$vs_fld,"getInfo $vs_attrib");
	}
}


### NEW

function runRemCommBg($vs_host, $vs_fld, $vs_cmd ) {
	exec($_SESSION['vs_cloud_base_dir'] . "/ctl/runRemoteBg " . $vs_host . " " . $vs_fld . " " . $vs_cmd);
}

function runRemComm($vs_host, $vs_fld, $vs_cmd ) {
        $cpipe = popen($_SESSION['vs_cloud_base_dir'] . "/ctl/runRemote " . $vs_host . " " . $vs_fld . " " . $vs_cmd ,"r");
        $res="";
        if ($cpipe) {
                while (($line = fgets($cpipe)) !== false) {
                        $res=$res . $line;
                }
                pclose($cpipe);
        }
        return trim($res);
}


/// attributes in folder name

function getVSowner($vs_fld) {
	$elem = explode("_",$vs_fld);
	return $elem[2];
}

function getVStype($vs_fld) {
	$elem = explode("_",$vs_fld);
	return $elem[1];
}

function getVSid($vs_fld) {
	$elem = explode("_",$vs_fld);
	return $elem[3];
}

function isVSowner($vs_fld, $user) {
	return ($user == getVSowner($vs_fld));
}


function getStatusHTML_TD($vs_status, $vs_fld) {
	if ($_SESSION['vs_cloud_isAdmin']) {
		$fixed_node=get_vs_info($vs_fld, "VS_FIXED_HOST");
		if(empty($fixed_node)) $node_info=" (" . get_vs_info($vs_fld, "VS_HOST") . ")";
		else $node_info=" [" . $fixed_node . "]";
	}
	else $node_info="";
	if ( $vs_status == "RUNNING" ) return "<td align=center bgcolor=#A0FFA0>$vs_status$node_info</td>";
	if ( $vs_status == "STOPPED" ) return "<td align=center bgcolor=#B0D0B0>$vs_status$node_info</td>";
	return "<td align=center bgcolor=#FFD080>$vs_status$node_info</td>";
}


function get_basic_vs_HTML_table($vs_fld) {
	$elem = explode("_",$vs_fld);
	// 0 - VS or VST
	// 1 - TYPE
	// 2 - OWNER
	// 3 - ID

	if ($elem[0]  == "VST") {
        	$isVST=true;
        	$new_content = "<table border=1 width=80% cellpadding=5><tr>
			<td bgcolor=#FFFFA0 align=center colspan=6>
			<b>WARNING: this is a Virtual Server Template</b></td></tr><tr>
                        <td bgcolor=#FFFFFF align=center><b>VST</b></td>
                        <td bgcolor=#FFFFFF align=center><b>VST Owner</b></td>
                        <td bgcolor=#FFFFFF align=center><b>VST Name</b></td>
                        <td bgcolor=#FFFFFF align=center><b>VST Soft Status</b></td>
                        <td bgcolor=#FFFFFF align=center><b><small>Cost</small></b></td>
                        <td bgcolor=#FFFFFF align=center><b>VST Type</b></td></tr>";
        }
        else {
        	$isVST=false;
                $new_content = "<table border=1 width=80% cellpadding=5><tr>
                	<td bgcolor=#FFFFFF align=center>VS</b></td>
                	<td bgcolor=#FFFFFF align=center><b>VS Owner</b></td>
                        <td bgcolor=#FFFFFF align=center><b>VS Name</b></td>
                        <td bgcolor=#FFFFFF align=center><b>VS Soft Status</b></td>
                        <td bgcolor=#FFFFFF align=center><b><small>Cost</small></b></td>
                        <td bgcolor=#FFFFFF align=center><b>VS Type</b></td>
                        <td bgcolor=#FFFFFF align=center><b>VST name</b></td></tr>";
	}

        $new_content = $new_content . "<tr><td align=center>vs$elem[3]</td>";
        $new_content = $new_content . "<td align=center>$elem[2]</td>";

        if ($isVST) $vs_name=getCachedAttrib($vs_fld,"VST_NAME");
        else $vs_name=getCachedAttrib($vs_fld,"VS_NAME");
        $detail_arg="vs_details_" . $vs_fld;
	$new_content = $new_content . "<td align=center>
                        <a href=\"javascript:reqAction('display','$detail_arg')\">$vs_name</a></td>";

	$vs_status = strtoupper(get_vs_info($vs_fld , "VS_STATUS"));
        $new_content = $new_content . getStatusHTML_TD($vs_status, $vs_fld);

        $vs_i=getCachedAttrib($vs_fld,"VST_COST");
        $vs_node=get_vs_info($vs_fld,"VS_HOST");
        if(empty($vs_node)) $cost="$vs_i"; else $cost="2x$vs_i";
        $new_content = $new_content . "<td align=center><small>$cost</small></td>";

        $vs_i=getVStypeDesc($vs_fld); 
        $new_content = $new_content . "<td align=center>$vs_i</td>";
        if (! $isVST) {
        	$vs_i=getCachedAttrib($vs_fld,"VST_NAME");
                $new_content = $new_content . "<td align=center>$vs_i</td>";
        }
	$new_content = $new_content . "</tr></table>";

	return $new_content;
}


function getVStypeDesc($vs_fld) {
	$elem = explode("_",$vs_fld);
	$ty = $elem[1];
	$iname= "cached_vs_type_desc_$ty";
	if(isset($_SESSION[$iname]) ) return $_SESSION[$iname];
	$td=get_vs_info($vs_fld , "VS_TYPE_DESC");
	$_SESSION[$iname]=$td;
	return $td;
}

####################################
/////////////// ATTRIBUTES CACHING 
####################################

function getCachedAttrib($vs_fld,$attrib) {
	$iname= "cached_$vs_fld" . "_" . $attrib;
	## 2022-05-25 - if empty refresh
	if(isset($_SESSION[$iname]) and ! empty($_SESSION[$iname])) return $_SESSION[$iname];
	$td=get_vs_info($vs_fld , $attrib);
	$_SESSION[$iname]=$td;
	return $td;
}

function getCachedAttribNode($vs_fld,$attrib) {
	$iname= "cached_$vs_fld" . "_" . $attrib;
	if(isset($_SESSION[$iname])) return $_SESSION[$iname];
	$td=get_vs_info_node($vs_fld , $attrib);
	$_SESSION[$iname]=$td;
	return $td;
}

function clearCachedAttrib($vs_fld,$attrib) {
	$iname= "cached_$vs_fld" . "_" . $attrib;
	$_SESSION[$iname]=NULL;
	unset($_SESSION[$iname]);
}

################## User credit caching

function getUserCredit() {
	$iname= "cached_user_credit";
	if(isset($_SESSION[$iname])) return $_SESSION[$iname];
	$td=run_local_command("/ctl/getCredit " . $_SESSION['vs_cloud_username']);
	$_SESSION[$iname]=$td;
	return $td;
}

function getUsedCredit() {
	$iname= "cached_used_credit";
	if( ! isset($_SESSION[$iname])  or empty($_SESSION[$iname])) return 0;
	return $_SESSION[$iname];
}

function setUsedCredit($credit) {
	$iname= "cached_used_credit";
	$_SESSION[$iname]=$credit;
}

function refreshUsedCredit() {
	$iname= "cached_used_credit";
	$td=run_local_command("/ctl/getUsedCredit " . $_SESSION['vs_cloud_username']);
	$_SESSION[$iname]=$td;
	return $td;
}


?>
