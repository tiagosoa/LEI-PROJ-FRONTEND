<?php

##

function buildHtmlVStable() {
	$user_colour="#E0E0E0";
	$user_total_credit = getUserCredit();
	$used_credit = getUsedCredit();
	if ( ! is_numeric($user_total_credit)) $user_total_credit = 10000;
	else $user_total_credit = intval($user_total_credit);

	if ($used_credit >= $user_total_credit) $td="<td bgcolor=#FFE010 align=center>";
	else $td="<td bgcolor=#A0FFA0 align=center>";
	$new_content = "<font face=arial><table border=0 width=95% cellspacing=1 cellpadding=5><tr>
		<td bgcolor=$user_colour align=center width=75%>
		<b>Your Virtual Servers (VS) and templates (VST)</b></td>
		$td Used credit: $used_credit / $user_total_credit</td>
		</tr></table>
		<table border=1 width=95% cellspacing=1 cellpadding=5><tr>
		<td bgcolor=$user_colour align=center>VS/VST</td>
		<td bgcolor=$user_colour align=center>VS/VST Name<br><small>(click to manage)</small></td>
		<td bgcolor=$user_colour align=center>Soft Status</td>
		<td bgcolor=$user_colour align=center><small>Cost<small></td>
		<td bgcolor=$user_colour align=center><b><small>DTR<br>(Days To Run)</small></td>
		<td bgcolor=$user_colour align=center>Original Template Name</td>
		<td bgcolor=$user_colour align=center>Virtual Server Type</td></tr>";

	$fld_list=get_fld_list($_SESSION['vs_cloud_username']);
	$num_fld=count($fld_list);
	$used_credit=0; // recalculate
	for($x=0;$x<$num_fld;$x++) {

		$vs_fld=$fld_list[$x];

		// should handle a VST as well
		$isVST = (substr($vs_fld,0,4) == "VST_");
		//
		// if ($isVST) $vs_i=getCachedAttrib($displayFld,"VST_NAME");

		$vs_i=getVSid($vs_fld);
		$new_content = $new_content . "<tr><td align=center><b>vs$vs_i</b></td>";

		$detail_arg="vs_details_" . $vs_fld;

		if ($isVST) $vs_i=getCachedAttrib($vs_fld,"VST_NAME");
		else $vs_i=getCachedAttrib($vs_fld,"VS_NAME");
		$new_content = $new_content . "<td align=center>
			<a href=\"javascript:reqAction('display','$detail_arg')\">$vs_i</a></td>";

		$vs_status = strtoupper(get_vs_info($vs_fld , "VS_STATUS"));
		$new_content = $new_content . getStatusHTML_TD($vs_status,$vs_fld);


		$vs_i=getCachedAttrib($vs_fld,"VST_COST");
		$vs_node=get_vs_info($vs_fld,"VS_HOST");
		if(empty($vs_node)) { $cost="$vs_i"; $used_credit = $used_credit + intval($vs_i); }
		else { $cost=2*$vs_i; $used_credit = $used_credit + 2 * intval($vs_i); }
		$new_content = $new_content . "<td align=center><small>$cost</small></td>";

		if(empty($vs_node)) $new_content = $new_content . "<td align=center>-</td>";
		else { $vs_i=getCachedAttrib($vs_fld,"VS_DTR"); if($vs_i<4) $bg=" bgcolor=#FFFFA0"; else $bg="";
			$new_content = $new_content . "<td align=center" . $bg . "><small>" . $vs_i . "</small></td>";
		}


		//if ($isVST) $vs_i="THIS IS A TEMPLATE !!!";
		//else $vs_i=getCachedAttrib($vs_fld,"VST_NAME");
		//$new_content = $new_content . "<td align=center>$vs_i</td>";

		if ($isVST) $new_content = $new_content . "<td align=center bgcolor=#FFFFE0>WARNING: this is a Virtual Server Template</td>";
		else $new_content = $new_content . "<td align=center>" . getCachedAttrib($vs_fld,"VST_NAME") . "</td>";
		//$new_content = $new_content . "<td align=center>$vs_i</td>";


		$vs_i=getVStypeDesc($vs_fld);
		$new_content = $new_content . "<td align=center>$vs_i</td></tr>";
	}
	$new_content = $new_content . "</table></font>";
	setUsedCredit( $used_credit );

	if($num_fld == 0) {  // TODO suggest some templates
		$new_content = $new_content . "<br><font face=consolas>
			<table border=1 width=80% cellspacing=1 cellpadding=5><tr>
			<td bgcolor=#FFFFD0>You haven't created any Virtual Server yet.
			</td></tr></table></font>";

	}

	return($new_content);
}


############ SHOW ALL VS LIST (administrators only)

function buildHtmlVStableALL() {
	$admin_colour="#FFFFE0";
	$new_content = "<table border=1 width=95% cellspacing=1 cellpadding=5><tr>
		<td bgcolor=$admin_colour align=center colspan=8>
		<b>All Virtual Servers (administrators)</b></td></tr><tr>
		<td bgcolor=$admin_colour align=center><b>VS</b></td>
		<td bgcolor=$admin_colour align=center><b>VS Owner</b></td>
		<td bgcolor=$admin_colour align=center><b>VS Name (click to manage)</b></td>
		<td bgcolor=$admin_colour align=center><b>Soft Status</b></td>
		<td bgcolor=$admin_colour align=center><b><small>Cost</small></td>
		<td bgcolor=$admin_colour align=center><b><small>DTR<br>(Days To Run)</small></td>
		<td bgcolor=$admin_colour align=center><b>VS Type</b></td>
		<td bgcolor=$admin_colour align=center><b>Source VST name</b></td></tr>";

	$fld_list=get_fld_list("VSALL");
	$num_fld=count($fld_list);

	for($x=0;$x<$num_fld;$x++) {
		$vs_fld=$fld_list[$x];

		$td="<td align=center bgcolor=#D0D0D0>";
        	$vs_i=getVSid($vs_fld);
        	$new_content = $new_content . "<tr>$td<b>vs$vs_i</b></td>";
        	$vs_i=getVSowner($vs_fld);
		$new_content = $new_content . "$td$vs_i</td>";
		$vs_i=get_vs_info($vs_fld , "VS_NAME");
		$detail_arg="vs_details_" . $vs_fld;
		$new_content = $new_content . "$td
                        <a href=\"javascript:reqAction('display','$detail_arg')\">$vs_i</a></td>";

		$vs_status = strtoupper(get_vs_info($vs_fld , "VS_STATUS"));
		$new_content = $new_content . getStatusHTML_TD($vs_status,$vs_fld);

		$vs_i = getCachedAttrib($vs_fld,"VST_COST");
		$vs_node=get_vs_info($vs_fld,"VS_HOST");
		if(empty($vs_node)) $cost="$vs_i"; else $cost=2 * $vs_i;  //$cost="2x$vs_i";
		$new_content = $new_content . $td . $cost . "</td>";

		if(empty($vs_node)) $new_content = $new_content . "<td align=center>-</td>";
		else { $vs_i=getCachedAttrib($vs_fld,"VS_DTR"); if($vs_i<4) $bg=" bgcolor=#FFFFA0"; else $bg="";
			$new_content = $new_content . "<td align=center" . $bg . "><small>" . $vs_i . "</small></td>";
		}

		$vs_i = getVStypeDesc($vs_fld);
		$new_content = $new_content . $td . $vs_i . "</td>";

        	$vs_i=getCachedAttrib($vs_fld,"VST_NAME");
		$new_content = $new_content . $td . "$vs_i</td</tr>";
        }
	$new_content = $new_content .  "</table>";
	return($new_content);
}





############ SHOW AND MANAGE VST LIST (administrators only)

function buildHtmlVSTtableALL() {
	$admin_colour="#FFFFE0";
	$new_content = "<table border=1 width=95% cellspacing=1 cellpadding=5><tr>
		<td bgcolor=$admin_colour align=center colspan=9>
		<b>All Virtual Server Templates (administrators)</b></td></tr><tr>
		<td bgcolor=$admin_colour align=center><b>ID</b></td>
		<td bgcolor=$admin_colour align=center><b>VST Owner</b></td>
		<td bgcolor=$admin_colour align=center><b>VST Name (click to manage)</b></td>
		<td bgcolor=$admin_colour align=center><b>Soft Status</b></td>
		<td bgcolor=$admin_colour align=center colspan=2><b>Disabled</b></td>
		<td bgcolor=$admin_colour align=center><b>Cost</b></td>
		<td bgcolor=$admin_colour align=center><b>VST Type</b></td></tr>";

	$fld_list=get_fld_list("VSTALL");
	$num_fld=count($fld_list);

	for($x=0;$x<$num_fld;$x++) {
		$vs_fld=$fld_list[$x];

		$isVST = (substr($vs_fld,0,4) == "VST_");
		$td="<td align=center bgcolor=#D0D0D0>";
        	$vs_i=getVSid($vs_fld);
        	$new_content = $new_content . "<tr>$td$vs_i</td>";
        	$vs_i=getVSowner($vs_fld);
		$new_content = $new_content . "$td$vs_i</td>";
		$vs_i=get_vs_info($vs_fld , "VST_NAME");
		$detail_arg="vs_details_" . $vs_fld;
		$new_content = $new_content . "$td
                        <a href=\"javascript:reqAction('display','$detail_arg')\">$vs_i</a></td>";

		$vs_status = strtoupper(get_vs_info($vs_fld , "VS_STATUS"));
		$new_content = $new_content . getStatusHTML_TD($vs_status,$vs_fld);

        	$vs_i=get_vs_info($vs_fld , "VST_DISABLED");
		if ( $vs_i == "YES" ) {
                	$new_content = $new_content . "<td align=center bgcolor=#FFD0A0>YES</td>
			$td<input type=button value=\" ENABLE \"
                        onClick=\"this.disabled=true;reqAction('enable','$vs_fld');\"></td>";
        	}
		else {
			$new_content = $new_content . "<td align=center bgcolor=#C0FFC0>NO</td>
			$td<input type=button value=DISABLE
                        onClick=\"this.disabled=true;reqAction('disable','$vs_fld');\"></td>";
		}


		$vs_i = getCachedAttrib($vs_fld,"VST_COST");
		$new_content = $new_content . $td . $vs_i . "</td>";
		$vs_i = getVStypeDesc($vs_fld);
		$new_content = $new_content . $td . $vs_i . "</td></tr>";
        }
	$new_content = $new_content .  "</table>";
	return($new_content);
}



############ SHOW TEMPLATES TABLE USERS USE CASE

function buildHtmlVSTtable() {
	$user_colour="#E0E0E0";
	$user_total_credit = getUserCredit();
	$used_credit = getUsedCredit();
	if ( ! is_numeric($user_total_credit)) $user_total_credit = 10000;
	else $user_total_credit = intval($user_total_credit);

	if ($used_credit >= $user_total_credit) $td="<td bgcolor=#FFE010 align=center>";
	else $td="<td bgcolor=#A0FFA0 align=center>";
	$new_content = "<font face=arial><table border=0 width=95% cellspacing=1 cellpadding=5><tr>
		<td bgcolor=$user_colour align=center width=75%>
		<b>Available Virtual Server Templates (VST)</b></td>
		$td Used credit: $used_credit / $user_total_credit</td>
		</tr></table>
		<table border=1 width=95% cellspacing=1 cellpadding=5><tr>
		<td bgcolor=$user_colour align=center>Number</td>
		<td bgcolor=$user_colour align=center>Virtual Server Template Name</td>
		<td bgcolor=$user_colour align=center>Virtual Server Template Description</td>
		<td bgcolor=$user_colour align=center>Virtual Server Type</td></tr>";

	if($_SESSION['vs_cloud_isAdmin']) $fld_list=get_fld_list("VSTALL"); // include disabled VSTs
	else $fld_list=get_fld_list("VST"); 
	$num_fld=count($fld_list);

	$credit_left =  $user_total_credit - $used_credit;

	for($x=0;$x<$num_fld;$x++) {
		$vs_fld=$fld_list[$x];
        	$vst_i=getVSid($fld_list[$x]);
        	$new_content = $new_content . "<tr><td align=center><big><b>$vst_i</b></big></td>";
		$vst_i=getCachedAttrib($fld_list[$x],"VST_NAME");
		$vst_h=getCachedAttrib($fld_list[$x],"VST_HTML");
		$vst_c=getCachedAttrib($fld_list[$x],"VST_COST");
		$new_content = $new_content . "<td align=center>$vst_h<br><b>$vst_i</b><br><br>
			(Cost: $vst_c)<br><br>";
		if ( $credit_left >= intval($vst_c)) {
			$new_content = $new_content . "<input type=button 
				value=\"Create a new VS from this template\"
				onClick=\"this.disabled=true;reqAction('create','$vs_fld');\"></td>";
		}
		else {
			$new_content = $new_content . "<input type=button disabled
				value=\"Create a new VS from this template\">
				<br><font face=consolas color=#A00000><b>(Insufficient Credit)</b></font></td>";

		}

        	$vst_i=getCachedAttrib($fld_list[$x],"VST_DESC");
        	$new_content = $new_content . "<td align=justify><pre>$vst_i</pre></td>";
		$vst_i = getVStypeDesc($fld_list[$x]);
        	$new_content = $new_content . "<td align=center>$vst_i</td></tr>";
        }
	$new_content = $new_content . "</table>";
	return($new_content);
}




############ RETURN VS/VST DETAILS HTML

function buildHtmlVSdetails($displayFld) {

	if ( ! isVSowner($displayFld, $_SESSION['vs_cloud_username']) and ! $_SESSION['vs_cloud_isAdmin']) return "";

	$admin_colour="#FFFFE0";
	$user_colour="#E0E0E0";
	$user_total_credit = getUserCredit();
	$used_credit = getUsedCredit();
	if ( ! is_numeric($user_total_credit)) $user_total_credit = 10000;
	else $user_total_credit = intval($user_total_credit);

	if ($used_credit >= $user_total_credit) $td="<td bgcolor=#FFE010 align=center>";
	else $td="<td bgcolor=#A0FFA0 align=center>";
	$new_content = "<font face=arial><table border=0 width=95% cellspacing=1 cellpadding=5><tr>
		<td bgcolor=$user_colour align=center width=75%>
		<b>Virtual Server Details</b></td>
		$td Used credit: $used_credit / $user_total_credit</td>
		</tr></table>";

	if (substr($displayFld,0,4) == "VST_") {
		$isVST=true;
		$new_content = $new_content . "<table border=1 width=95% cellpadding=5><tr>
			<td bgcolor=$admin_colour align=center colspan=8>WARNING: this is a Virtual Server Template
			</td></tr><tr>
			<td bgcolor=$admin_colour align=center>VST</td>
			<td bgcolor=$admin_colour align=center>Owner</td>
			<td bgcolor=$admin_colour align=center>VST Name</td>
			<td bgcolor=$admin_colour align=center>VST Soft Status</td>
			<td bgcolor=$admin_colour align=center>VST Hard Status</td>
			<td bgcolor=$admin_colour align=center><small>Cost</small></td>
			<td bgcolor=$admin_colour align=center><b><small>DTR<br>(Days To Run)</small></td>
			<td bgcolor=$admin_colour align=center>VST Type</td></tr>";
	}
	else {
		$isVST=false;
		$new_content = $new_content . "<table border=1 width=95% cellpadding=5><tr>
		<td bgcolor=$user_colour align=center>VS</td>
		<td bgcolor=$user_colour align=center>Owner</td>
		<td bgcolor=$user_colour align=center>VS Name</td>
		<td bgcolor=$user_colour align=center>VS Soft Status</td>
		<td bgcolor=$user_colour align=center>VS Hard Status</td>
		<td bgcolor=$user_colour align=center><small>Cost</small></td>
		<td bgcolor=$user_colour align=center><b><small>DTR<br>(Days To Run)</small></td>
		<td bgcolor=$user_colour align=center>VS Type</td>
		<td bgcolor=$user_colour align=center>Original VST name</td></tr>";
	}
        $vs_i=getVSid($displayFld);
        $new_content = $new_content . "<tr><td align=center><b>vs$vs_i</b></td>";
        $vs_i=getVSowner($displayFld);
	$new_content = $new_content . "<td align=center>$vs_i</td>";

	if ($isVST) $vs_i=getCachedAttrib($displayFld,"VST_NAME");
	else $vs_i=getCachedAttrib($displayFld,"VS_NAME");
	$new_content = $new_content . "<td align=center>$vs_i</td>";

	$vs_status = strtoupper(get_vs_info($displayFld , "VS_STATUS"));
	$new_content = $new_content . getStatusHTML_TD($vs_status,$displayFld);

	// HARD STATUS
	$vs_node=get_vs_info($displayFld , "VS_HOST");
	if ( empty($vs_node )) {
		$new_content = $new_content . "<td align=center>-</td>";
		$vs_hard_status = "unknown";
	}
	else {
		$vs_hard_status = get_vs_hard_status($displayFld, $vs_node);
		if ( $vs_hard_status == "running" )
			$new_content = $new_content . "<td align=center bgcolor=#A0FFA0>RUNNING</td>";
		else
		if ( $vs_hard_status == "stopped" )
			$new_content = $new_content . "<td align=center bgcolor=#B0D0B0>STOPPED</td>";
		else
			$new_content = $new_content . "<td align=center bgcolor=#FFD000>UNKNOWN</td>";
	}

	$vs_cost = getCachedAttrib($displayFld,"VST_COST");
	if(empty($vs_node)) $cost="$vs_cost"; else $cost=2 * $vs_cost;  // $cost="2x$vs_cost";
	$new_content = $new_content . "<td align=center><small>$cost</small></td>";



	$vs_i=getCachedAttrib($displayFld,"VS_DTR"); if($vs_i<4) $bg=" bgcolor=#FFFFA0"; else $bg="";
	$new_content = $new_content . "<td align=center" . $bg . "><small>" . $vs_i . "</small></td>";


	$vs_i=getVStypeDesc($displayFld);
	$new_content = $new_content . "<td align=center>$vs_i</td>";
	if (! $isVST) {
        	$vs_i=getCachedAttrib($displayFld,"VST_NAME");
		$new_content = $new_content . "<td align=center>$vs_i</td>";
	}

	$new_content = $new_content . "</tr></table><br>";

	$start_bt="";
	$stop_bt="";
	$delete_bt="";
	$reset_dtr_bt="";
	$vs_msg="";

	//if ( $vs_status != "RUNNING" ) $stop_bt="disabled";
	if ( $vs_status == "STOPPED" ) $stop_bt="disabled";

	// TODO : other conditions
	if ( $vs_status != "STOPPED" ) { 
		$start_bt="disabled"; $delete_bt="disabled";
		$vs_msg=$vs_msg . "<p><font size=2>To delete the VS, it must be stopped first.</font>";
	}
	else {
		$vs_msg=$vs_msg . "<p><font size=2>To access the VS, it must be running.</font>";
		if( getUsedCredit() + intval($vs_cost) > $user_total_credit) {
		  if( refreshUsedCredit() + intval($vs_cost) > $user_total_credit) {
			$start_bt="disabled";
			$vs_msg=$vs_msg . "<p><font color=red><b>Sorry:</b> the Virtual Server can't be started 
				due to insufficient credit.</font>";
		  }
		}
		// TODO : other conditions

	}

	if($isVST) $delete_bt="disabled";
	$vs_i=getCachedAttrib($displayFld,"VS_DTR");
	if( $vs_i > 29 ) $reset_dtr_bt="disabled";

	$rename_arg = "vs_rename_" . $displayFld;
	$delete_arg = "vs_delete_" . $displayFld;
	$rep_issue_arg = "vs_report_issue_" . $displayFld;
	$new_content = $new_content . "<table border=1 width=95% cellpadding=5><tr>
		<td bgcolor=#FFFFFF width=40% align=center>
		<input type=button value=START $start_bt
                 onClick=\"this.disabled=true;reqAction('start','$displayFld');\">&nbsp;&nbsp;
		<input type=button value=STOP $stop_bt
                 onClick=\"this.disabled=true;reqAction('stop','$displayFld');\">&nbsp;&nbsp;
 		<input type=button value=RENAME
		 onClick=\"this.disabled=true;reqAction('display','$rename_arg')\">&nbsp;&nbsp;
		<input type=button value=DELETE $delete_bt
		 onClick=\"this.disabled=true;reqAction('display','$delete_arg');\">
		<input type=button value=\"RESET DTR\" $reset_dtr_bt
		 onClick=\"reqAction('reset_dtr','$displayFld');\">
		<input type=button value=\"REPORT ISSUE\" 
		 onClick=\"reqAction('display','$rep_issue_arg');\">
		</td><td bgcolor=#FFFFFF width=40% align=left>$vs_msg</td></tr></table><br>";

	// use hard status instead
	if ( $vs_hard_status == "running" and $vs_status == "RUNNING" ) {
	//if ( $vs_status == "RUNNING" ) {
		//// DEPENDING ON DEFINED ATTRIBUTES, OTHER ACCESS FORMS MAY BY PRESENTED HERE
		// SSH, VNC, HTTP, SHELLINABOX, VNC, ...
		//
		
		$new_content = $new_content . buildHtmlVSaccessOptions($displayFld);
	}



	//// ADD DESCRIPTIONS
	if ( $isVST) {
		$new_content = $new_content . "<table border=1 width=95% cellpadding=5><tr>
			<td bgcolor=#FFFFFF align=center>Virtual Server Template Description &nbsp;";
		$edit_arg = "vs_editdesc_" . $displayFld;
		$new_content = $new_content . "<input type=button value=EDIT
			onClick=\"this.disabled=true;reqAction('display','$edit_arg')\"></td>";
	}
	else {
		$new_content = $new_content . "<table border=1 width=95% cellpadding=5><tr>
			<td bgcolor=#FFFFFF align=center>Virtual Server Description &nbsp;";
		$edit_arg = "vs_editdesc_" . $displayFld;
		$new_content = $new_content . "<input type=button value=EDIT
			onClick=\"this.disabled=true;reqAction('display','$edit_arg')\"></td>";
		$new_content = $new_content . "<td bgcolor=#FFFFFF align=center>
			Original Virtual Server Template Description</td></tr>";
	}
	$new_content = $new_content . "<tr><td align=justify><pre>";
	if (! $isVST) {
		$vs_i=getCachedAttrib($displayFld,"VS_DESC");
		$new_content = $new_content . "$vs_i</pre></td><td align=justify><pre>";
	}
	$vs_i=getCachedAttrib($displayFld,"VST_DESC");
	$new_content = $new_content . "$vs_i</pre></td></tr></table>";


	// ADD ADMIN OPTIONS - SHOW LOW LEVEL RAW INFORMATION AND SET RAW ATTRIBUTE
	if ( $_SESSION['vs_cloud_isAdmin']) {
		$raw_arg = "vs_rawinfo_" . $displayFld;
		$raw_arg2 = "vs_setraw_" . $displayFld;
		$new_content = $new_content . "<br><table border=1 width=95% cellpadding=5>
			<tr><td align=center bgcolor=$admin_colour>
			<input type=button value=\"SHOW LOW LEVEL RAW INFORMATION\"
			onClick=\"this.disabled=true;reqAction('display','$raw_arg');\">&nbsp;&nbsp;
			<input type=button value=\"RAW SETTING OF A VS/VST ATTRIBUTE\"
			onClick=\"this.disabled=true;reqAction('display','$raw_arg2');\"
			</td></tr></table>";
	}


	// ADD SHOW NETWORK CONFIG INFORMATION OPTION
	$raw_arg = "vs_netconfig_" . $displayFld;
	$new_content = $new_content . "<br><table border=1 width=95% cellpadding=5>
			<tr><td align=center bgcolor=#D0D0B0>
			<input type=button value=\"SHOW NETWORK CONFIGURATION DATA FOR NETWORK [VNET1]\"
			onClick=\"this.disabled=true;reqAction('display','$raw_arg');\">
			</td></tr></table>";

	return $new_content;

} 

///////////////////////// END VS/VST DETAILS


function buildHtmlVSaccessOptions($displayFld) {

	// THIS WILL REPLACE ALL BELOW CUSTOM ATTRIBUTES
	//
	// CUSTOM_ACCESS
	$new_content = "<table border=1 width=95% cellpadding=5><tr>
                   <td bgcolor=#FFFFFF align=left><font face=consolas>";

	$hpass="*********************";
	// 1 - SSH
	// 2 - VNC
	// 9 - Terminal in browser (e.g. ttyd, shellinabox, GoTTY)
	// 10 - Shell in a box direct (no login)
	// 7 - HTTP
	// 8 - HTTPS
	// 6 - File Manager
	// 11 - Services Manager
	// 12 to 16 - Port redirects
	// 17 - GoTTY
	// 18 - Tiny Filemanager
	// 19 - GoTTY - Public access
	// 20 - Multiple addresses - VNET1 .. VNET4
	$seq = array(1,2,3,9,10,17,19,4,5,7,8,6,11,12,13,14,15,16,18,20,21,22,23,24,25);
	foreach ($seq as &$x) {
	//for($x=1;$x<=20;$x++) {
	  $custom_desc=getCachedAttrib($displayFld, "CUSTOM_ACCESS" . $x . "_DESC");
	  if(!empty($custom_desc)) {
	     $custom_en_dis=getCachedAttrib($displayFld, "CUSTOM_ACCESS" . $x . "_ENABLED_DISABLED");
	     if(!empty($custom_en_dis)) {
		if($custom_en_dis == "enabled" ) {
			$act="disableCustomAccess" . $x;
			$new_content = $new_content . "<input type=button value=DISABLE
                                 onClick=\"this.disabled=true;reqAction('$act','$displayFld')\">&nbsp;";
		}
		else {
			$act="enableCustomAccess" . $x;
			$new_content = $new_content . "<input type=button value=\" ENABLE\"
				onClick=\"this.disabled=true;reqAction('$act','$displayFld')\">&nbsp;";
			// $custom_desc_dis=getCachedAttrib($displayFld, "CUSTOM_ACCESS" . $x . "_DESC_DISABLED");
			// if(!empty($custom_desc_dis)) { $custom_desc=$custom_desc_dis; }
		}
	     }


	     $new_content = $new_content . $custom_desc;
	     $custom_pass=getCachedAttribNode($displayFld, "CUSTOM_ACCESS" . $x . "_PASS");
	     $id="cpass" . $x;
	     if(!empty($custom_pass)) {
		  $new_content = $new_content . "
                                <input size=12 readonly type=text value='$hpass' id='$id'>
                                &nbsp;<input type=button value=SHOW
                                onClick=\"document.getElementById('$id').value='$custom_pass';\">
                                &nbsp;<input type=button value=HIDE
                                onClick=\"document.getElementById('$id').value='$hpass';\">
                                &nbsp;<input type=button value=COPY
                                onClick=\"document.getElementById('$id').value='$custom_pass';
                                document.getElementById('$id').select(); document.execCommand('copy');
				document.getElementById('$id').value='$hpass';\">";

		  $custom_pass_change=getCachedAttrib($displayFld, "CUSTOM_ACCESS" . $x . "_PASS_CHANGE");
	          if(!empty($custom_pass_change)) {
			$custom_pass_arg = "vs_change_custom_pass_" . $x . "_" . $displayFld;
			$new_content = $new_content . "&nbsp;&nbsp;<input type=button value=CHANGE
                                onClick=\"this.disabled=true;reqAction('display','$custom_pass_arg');\">";
	          }
	     }
	     $new_content = $new_content . "<hr/>";
	  }
	}

	$new_content = $new_content . "</font></td></tr></table><br>";
	// END CUSTOM_ACCESS, BELLOW IS TO BE REMOVED





	/// VNC ACCESS
	$vs_i_p=getCachedAttribNode($displayFld, "VNC_PASS");
	if (!empty($vs_i_p)) {
		$vs_i=getCachedAttrib($displayFld , "VNC_ACCESS");
		$new_content = $new_content . "<table border=1 width=95% cellpadding=5><tr>
				<td bgcolor=#FFFFFF width=50% align=center>
				VNC Graphical access to the Virtual Server</td>
				<td bgcolor=#FFFFFF align=center>VNC Password</td></tr>";

		$new_content = $new_content . "<td align=center><input size=12 readonly type=text 
				value='$vs_i' id='vncaccess'>
				&nbsp;&nbsp;<input type=button value=COPY 
				onClick=\"document.getElementById('vncaccess').select(); document.execCommand('copy');\">";

		$hpass="***************";
		$new_content = $new_content . "<td align=center>
				<input size=12 readonly type=text value='$hpass' id='vncpass'><br>
				&nbsp;&nbsp;<input type=button value=SHOW 
				onClick=\"document.getElementById('vncpass').value='$vs_i_p';\">
				&nbsp;&nbsp;<input type=button value=HIDE 
				onClick=\"document.getElementById('vncpass').value='$hpass';\">
				&nbsp;&nbsp;<input type=button value=COPY 
				onClick=\"document.getElementById('vncpass').value='$vs_i_p';
				document.getElementById('vncpass').select(); document.execCommand('copy');
				document.getElementById('vncpass').value='$hpass';\">
				</td></tr></table><br>";
	}  // END VNC ACCESS


	/// SSH ACCESS
	$vs_ssh=getCachedAttrib($displayFld , "SSH_ACCESS");  // FORMAT: USER@IPADDRESS:PORT
	if (!empty($vs_ssh)) {
		$elem = explode("@",$vs_ssh); $ssh_user=$elem[0]; 
		$elem = explode(":",$elem[1]); $ssh_host=$elem[0]; $ssh_port=$elem[1];
		$new_content = $new_content . "<table border=1 width=95% cellpadding=5><tr>
			<td bgcolor=#FFFFFF width=70% align=center>
			User <b>$ssh_user</b> SSH access to the Virtual Server (port number <b>$ssh_port</b>)</td>
			<td bgcolor=#FFFFFF align=center>SSH Access password </td></tr>";

		$new_content = $new_content . "<td align=center><input size=15 readonly type=text 
			value='$ssh_host' id='sshaccess'><br><br>
			<input type=button value=\"COPY $ssh_host\"
			onClick=\"document.getElementById('sshaccess').value='$ssh_host';
				document.getElementById('sshaccess').select(); document.execCommand('copy');\">
			&nbsp;&nbsp;<input type=button value=\"COPY $ssh_host:$ssh_port\"
			onClick=\"document.getElementById('sshaccess').value='$ssh_host:$ssh_port';
				document.getElementById('sshaccess').select(); document.execCommand('copy');\">
			&nbsp;&nbsp;<input type=button value=\"COPY $ssh_user@$ssh_host\"
			onClick=\"document.getElementById('sshaccess').value='$ssh_user@$ssh_host';
				document.getElementById('sshaccess').select(); document.execCommand('copy');\">
			&nbsp;&nbsp;<input type=button value=\"COPY $ssh_user@$ssh_host:$ssh_port\"
			onClick=\"document.getElementById('sshaccess').value='$ssh_user@$ssh_host:$ssh_port';
				document.getElementById('sshaccess').select(); document.execCommand('copy');\">
			";

		$vs_i=getCachedAttribNode($displayFld, "SSH_PASS");

                $hpass="***************";
                $new_content = $new_content . "<td align=center>
                                <input size=12 readonly type=text value='$hpass' id='sshpass'><br><br>
                                &nbsp;&nbsp;<input type=button value=SHOW
                                onClick=\"document.getElementById('sshpass').value='$vs_i';\">
                                &nbsp;&nbsp;<input type=button value=HIDE
                                onClick=\"document.getElementById('sshpass').value='$hpass';\">
                                &nbsp;&nbsp;<input type=button value=COPY
                                onClick=\"document.getElementById('sshpass').value='$vs_i';
                                document.getElementById('sshpass').select(); document.execCommand('copy');
                                document.getElementById('sshpass').value='$hpass';\">
                                </td></tr></table><br>";
	} // END SSH ACCESS



	// OTHERS: HTTP/HTTPS SHELLINABOX
	$new_content = $new_content . "<table border=1 width=95% cellpadding=5><tr>
                   <td bgcolor=#FFFFFF align=left><font face=consolas>";
	$vs_custom=getCachedAttrib($displayFld, "CUSTOM_HTTP");
	if(!empty($vs_custom)) {
		$new_content = $new_content . "Your HTTP server:
			<a href=$vs_custom target=your_http>$vs_custom</a><br>";
	}
	$vs_custom=getCachedAttrib($displayFld, "CUSTOM_HTTPS");
	if(!empty($vs_custom)) {
		$new_content = $new_content . "Your HTTPS server:
			<a href=$vs_custom target=your_http>$vs_custom</a><br>";
	}


	$vs_custom=getCachedAttrib($displayFld, "CUSTOM_SHELLINABOX");
	if(!empty($vs_custom)) {
		$new_content = $new_content . "Your Shell In A Box server:
			<a href=$vs_custom target=your_shellinabox>$vs_custom</a> (auth required)<br>";

		$vs_custom2=getCachedAttrib($displayFld, "CUSTOM_SHELLINABOX_DIRECT");
		if(empty($vs_custom2)) {
			$new_content = $new_content . "<input type=button value=\" ENABLE\"
				onClick=\"this.disabled=true;reqAction('enableShellInaBoxDirect','$displayFld')\">
					Shell In A Box Direct Access (no auth)<br>";
		}
		else {
			$new_content = $new_content . "<input type=button value=DISABLE
                                 onClick=\"this.disabled=true;reqAction('disableShellInaBoxDirect','$displayFld')\"> ";
			$new_content = $new_content . "<a href=$vs_custom2 target=your_shellinabox>Shell In A Box Direct Access (no auth)</a><br>";
		}
	}


	// OTHER CUSTOM URLs - CUSTOM_URL1_NAME / CUSTOM_URL1 (...)
	for($x=1;$x<5;$x++) {
	  $vs_custom_name=getCachedAttrib($displayFld, "CUSTOM_URL" . $x . "_NAME");
	  if(!empty($vs_custom_name)) {
		$vs_custom=getCachedAttrib($displayFld, "CUSTOM_URL" . $x);
		if(!empty($vs_custom)) {
		$new_content = $new_content . $vs_custom_name .
			": <a href=$vs_custom target=your_$vs_custom_name>$vs_custom</a><br>";
		}
	  }
	}




	$new_content = $new_content . "</font></td></tr></table><br>";
	return $new_content;
}










###################### SHOW RAW INFORMATION ON VS/VST (ADMINS)

function buildHtmlVSrawInfo($displayFld) {
	if ( ! $_SESSION['vs_cloud_isAdmin']) return "";
	$new_content=get_basic_vs_HTML_table($displayFld);
	$new_content = $new_content . "<br><table border=1 width=95% cellpadding=5><tr>
		<td bgcolor=#FFFFC0 align=center>Virtual Server Raw Information</td></tr>
		<tr><td bgcolor=#E0E0E0 align=left><pre>";
	$new_content = $new_content . get_vs_info_node($displayFld, "");
	$new_content = $new_content . "</pre></td></tr></table>";
	return $new_content;
}


###################### RAW SETTING OF VS/VST ATTRIBUTE (ADMINS)
#
function buildHtmlVSsetRawAttribute($displayFld) {
	if ( ! $_SESSION['vs_cloud_isAdmin']) return "";
	$new_content=get_basic_vs_HTML_table($displayFld);
	$detail_arg="vs_details_" . $displayFld;
	$new_content = $new_content . "<br><table border=1 cellpadding=10 width=95%><tr>
			<td align=center bgcolor=$admin_colour>
			<b>RAW SETTING OF VS/VST ATTRIBUTE (hope you know what you are doing)</b><br><br>
			(enter the attribute name and value separated by a space)<br><br>
			<input id=userinputdata type=text size=80 value=>
			&nbsp; &nbsp;<input type=button value=SET
			onClick=\"this.disabled=true;reqInputAction('rawsetinfo','$displayFld')\">&nbsp;&nbsp;
			<input type=button value=CANCEL
			onClick=\"this.disabled=true;reqAction('display','$detail_arg')\"></tr></table>";
	return $new_content;
}


###################### SHOW CLUSTER STATUS (ADMINS)
### TODO - change this to use the local status instead
function buildHtmlClusterStatus() {
	$admin_colour="#FFFFE0";
	$new_content = "<table border=1 width=90% cellpadding=5>";
	$new_content = $new_content . "<tr><td bgcolor=$admin_colour align=center>NODE</td>
		<td bgcolor=$admin_colour align=center>Load Metric</td>
		<td bgcolor=$admin_colour align=center>STATUS INFO</td></tr>";
	$fld_list=get_nodes_list();
	$num_fld=count($fld_list);
	for($x=0;$x<$num_fld;$x++) {
		$node=$fld_list[$x];
		$node_load=get_node_info($node, "load");
		$node_uptime=substr(get_node_info($node, "uptime"),17);
		$new_content = $new_content . "<tr><td bgcolor=#D0D0D0 align=center>$node</td>";
		if ( $node_load === '' ) {
			$new_content = $new_content . "<td bgcolor=#FFD070 align=center><b>OFFLINE</b></td>
				<td bgcolor=#FFD070 align=left>$node_uptime</td></tr>";
		}
		else {
			$node_uptime=substr(get_node_info($node, "uptime"),17);
			$new_content = $new_content . "<td bgcolor=#D0FFD0 align=center>$node_load</td>
				<td bgcolor=#D0FFD0 align=left>$node_uptime</td></tr>";
		}
	}
	$new_content = $new_content . "</table>";
	return $new_content;
}


###################### SHOW NETWORK CONFIGURATION INFORMATION FOR VS/VST

function buildHtmlVSnetConfig($displayFld) {
	$new_content=get_basic_vs_HTML_table($displayFld);
	$new_content = $new_content . "<br><table border=1 width=95% cellpadding=5><tr>
			<td bgcolor=#FFFFC0 align=center><b>Virtual Server Configuration Data for
			Network [VNET1]</b><br><br>
			(STATIC CONFIGURATION TO BE USED IF NOT ALREADY SETTLED)</td></tr>
			<tr><td bgcolor=#E0E0E0 align=left>";
	$new_content = $new_content . get_vs_info($displayFld, "VS_NET_CONFIG");
	$new_content = $new_content . "</td></tr></table>";
	return($new_content);
}


###################### RENAME A VS OR VST USE CASE

function buildHtmlVSrename($displayFld) {
	if ( ! isVSowner($displayFld, $_SESSION['vs_cloud_username']) and ! $_SESSION['vs_cloud_isAdmin']) return "";
	$new_content=get_basic_vs_HTML_table($displayFld);
	$detail_arg="vs_details_" . $displayFld;
	if (substr($displayFld,0,3) == "VS_") $vs_name=getCachedAttrib($displayFld,"VS_NAME");
	else $vs_name=getCachedAttrib($displayFld,"VST_NAME");
	$new_content = $new_content . "<br><br><table border=1 cellpadding=10 width=95%><tr><td>NEW NAME:
		&nbsp; &nbsp;<input id=userinputdata type=text size=60 value=\"$vs_name\">
		&nbsp; &nbsp;<input type=button value=RENAME
		onClick=\"this.disabled=true;reqInputAction('rename','$displayFld')\">&nbsp;&nbsp;
		<input type=button value=CANCEL
		onClick=\"this.disabled=true;reqAction('display','$detail_arg')\"></tr></table>";
	return($new_content);
}


###################### EDIT A VS OR VST DESCRIPTION USE CASE

function buildHtmlVSeditDesc($displayFld) {
	if ( ! isVSowner($displayFld, $_SESSION['vs_cloud_username']) and ! $_SESSION['vs_cloud_isAdmin']) return "";
	$new_content=get_basic_vs_HTML_table($displayFld);

	if (substr($displayFld,0,4) == "VST_") $vs_i=getCachedAttrib($displayFld,"VST_DESC");
	else $vs_i=getCachedAttrib($displayFld,"VS_DESC");

	$detail_arg="vs_details_" . $displayFld;
	$new_content = $new_content . "<br><br><table border=1 cellpadding=10 width=95%><tr>
		<td align=center>CHANGE DESCRIPTION
		&nbsp; &nbsp;<input type=button value=SAVE
		onClick=\"this.disabled=true;reqInputAction('editdesc','$displayFld')\">&nbsp;
		<input type=button value=CANCEL
		onClick=\"this.disabled=true;reqAction('display','$detail_arg')\"><br><br>
		<textarea id=userinputdata rows=40 cols=60>$vs_i</textarea></td></tr></table>";
	return($new_content);
}

###################### REPORT AN ISSUE USE CASE

function buildHtmlVSreportIssue($displayFld) {
        if ( ! isVSowner($displayFld, $_SESSION['vs_cloud_username']) and ! $_SESSION['vs_cloud_isAdmin']) return "";
        $new_content=get_basic_vs_HTML_table($displayFld);

        $detail_arg="vs_details_" . $displayFld;
        $new_content = $new_content . "<br><br><table border=1 cellpadding=10 width=95%><tr>
                <td align=center>REPORT AN ISSUE OR MAKE A SUGGESTION
                &nbsp; &nbsp;<input type=button value=SUBMIT
                onClick=\"this.disabled=true;reqInputAction('report_issue','$displayFld')\">&nbsp;
                <input type=button value=CANCEL
                onClick=\"this.disabled=true;reqAction('display','$detail_arg')\"><br><br>
                <textarea id=userinputdata rows=40 cols=80></textarea></td></tr></table>";
        return($new_content);
}


###################### DELETE A VS

function buildHtmlVSdelete($displayFld) {
	if ( ! isVSowner($displayFld, $_SESSION['vs_cloud_username']) and ! $_SESSION['vs_cloud_isAdmin']) return "";
	$new_content=get_basic_vs_HTML_table($displayFld);
	$detail_arg="vs_details_" . $displayFld;
	$new_content = $new_content . "<br><br><table border=1 cellpadding=10 width=95%><tr>
		<td align=center bgcolor=#FF4020>
		Are you sure you want to DESTROY this virtual server ? &nbsp;&nbsp;
		<input type=button value=\"DELETE THIS VIRTUAL SERVER !!!\"
		onClick=\"this.disabled=true;reqAction('delete','$displayFld');\">&nbsp;&nbsp;
		<input type=button value=CANCEL
		onClick=\"this.disabled=true;reqAction('display','$detail_arg')\"></tr></table>";
	return($new_content);
}



//// CHANGE THE VNC PASSWORD  -- TODO: remove this function, not used any more

function buildHtmlVSchangeVNCpass($displayFld) {
	if ( ! isVSowner($displayFld, $_SESSION['vs_cloud_username']) and ! $_SESSION['vs_cloud_isAdmin']) return "";
	$new_content=get_basic_vs_HTML_table($displayFld);

	$detail_arg="vs_details_" . $displayFld;
	$new_content = $new_content . "<br><br><table border=1 cellpadding=10 width=95%><tr>
		<td>NEW PASSWORD FOR VNC GRAPHICAL ACCESS:&nbsp; &nbsp;
		<input id=userinputdata type=password size=20>&nbsp; &nbsp;
		<input id=spb type=button value=\"SET PASSWORD\"
		onClick=\"reqInputAction('setVNCpass','$displayFld')\"><br><br>
		<input type=button value=\"SET A RANDOM PASSWORD\"
		onClick=\"document.getElementById('userinputdata').value=Math.random().toString(36).slice(-10);
		document.getElementById('spb').disabled=true;
		reqInputAction('setVNCpass','$displayFld')\">&nbsp; &nbsp;
		<input type=button value=CANCEL
		onClick=\"reqAction('display','$detail_arg')\"></tr></table>";
	return($new_content);
}


//// CHANGE THE SSH PASSWORD USE CASE   -- TODO: remove this function, not used any more

function buildHtmlVSchangeSSHpass($displayFld) {
	if ( ! isVSowner($displayFld, $_SESSION['vs_cloud_username']) and ! $_SESSION['vs_cloud_isAdmin']) return "";
        $new_content=get_basic_vs_HTML_table($displayFld);

        $detail_arg="vs_details_" . $displayFld;
        $new_content = $new_content . "<br><br><table border=1 cellpadding=10 width=95%><tr>
                <td>NEW PASSWORD FOR SSH ACCESS:&nbsp; &nbsp;
                        <input id=userinputdata type=password size=20>&nbsp; &nbsp;
                        <input id=spb type=button value=\"SET PASSWORD\"
                        onClick=\"this.disabled=true;reqInputAction('setSSHpass','$displayFld')\"><br><br>
                        <input type=button value=\"SET A RANDOM PASSWORD\"
                        onClick=\"document.getElementById('userinputdata').value=Math.random().toString(36).slice(-10);
			document.getElementById('spb').disabled=true;
			reqInputAction('setSSHpass','$displayFld')\">&nbsp; &nbsp;
                        <input type=button value=CANCEL
                        onClick=\"this.disabled=true;reqAction('display','$detail_arg')\"></tr></table>";
	return($new_content);
}


//
// Above change password functions are now obsolete and kept for old VSs only
//
// Change the password in an attribute CUSTOM_ACCESS{N}_PASS
//

function buildHtmlVSchangeCustomPass($displayData) {   // display data = N_displayFld
	$d=explode("_",$displayData,2);
	$displayFld=$d[1];
	$customN=$d[0];
	if ( ! isVSowner($displayFld, $_SESSION['vs_cloud_username']) and ! $_SESSION['vs_cloud_isAdmin']) return "";
	$new_content=get_basic_vs_HTML_table($displayFld);
	$detail_arg="vs_details_" . $displayFld;
	$act="setCustomPass" . $customN;
	$custom_pass_change=getCachedAttrib($displayFld, "CUSTOM_ACCESS" . $customN . "_PASS_CHANGE");
	$custom_old_pass=getCachedAttrib($displayFld, "CUSTOM_ACCESS" . $customN . "_PASS");
        $new_content = $new_content . "<br><br><table border=1 cellpadding=10 width=95%><tr>
                <td><h2>$custom_pass_change</h2><br>NEW PASSWORD:&nbsp; &nbsp;
                        <input id=userinputdata type=password size=20 value='$custom_old_pass'>&nbsp; &nbsp;
                        <input id=spb type=button value=\"SET PASSWORD\"
                        onClick=\"this.disabled=true;reqInputAction('$act','$displayFld')\"><br><br>
                        <input type=button value=\"SET A RANDOM PASSWORD\"
                        onClick=\"document.getElementById('userinputdata').value='XozTi'+Math.random().toString(36).substr(2,8);
                        document.getElementById('spb').disabled=true;
                        reqInputAction('$act','$displayFld')\">&nbsp; &nbsp;
                        <input type=button value=CANCEL
                        onClick=\"this.disabled=true;reqAction('display','$detail_arg')\"></tr></table>";
        return($new_content);
}




?>
