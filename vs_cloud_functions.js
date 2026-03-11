



function submitActionForm(act, __form) {
        document.main.__action.value=act;
        document.main.target="_self";
        document.main.action=__form;
        document.main.submit();
        }

function submitActionFormNew(act, __form) {
        document.main.__action.value=act;
        document.main.target="_blank";
        document.main.action=__form;
        document.main.submit();
        }

function closeWin() {
        close();
        }

function openWinPopup(wurl, wname) {
        myWin= open(wurl, wname, "width=710,height=500,status=yes,resizable=yes,scrollbars=yes,toolbar=no,menubar=no");
        }

function openWin(wurl) {
        myWin= open(wurl);
        }

var did_timeout=0;

var timeoutHTML="<table border=0 width=80%><tr><td bgcolor=#FFFF00 align=center>Server not responding / timed out, please wait ...</td></tr></table>";
var errorHTML="<table border=0 width=80%><tr><td bgcolor=#FFFF00 align=center>Server not responding, please wait ...</td></tr></table>";
var pleaseWait="<table border=0 width=80%><tr><td bgcolor=#E0E0FF align=center> Please wait ... </td></tr></table>";
var forceRefresh=1;

// refresh display area
function refreshDisplayVS(force) {
	var request = new XMLHttpRequest();

	request.onload= function upDate() {
		// this.status == 200

		did_timeout=0;
		if ( this.responseText.substring(0, 4) != "same" ) {
			//document.getElementById("vs_display").scrollTop = 0;
			document.getElementById("vs_display").innerHTML= this.responseText;
			document.getElementById("vs_err").innerHTML = "+";
		}
		else {
			document.getElementById("vs_err").innerHTML = "*";
		}
		setTimeout(refreshDisplayVS, 1000, forceRefresh);
		forceRefresh=0;
	};

	request.ontimeout= function timeoutCase() {
		did_timeout=1;
		document.getElementById("vs_err").innerHTML = timeoutHTML;
		setTimeout(refreshDisplayVS, 1000,"1");
	};

	request.onerror= function errorCase() {
		did_timeout=1;
		document.getElementById("vs_err").innerHTML = errorHTML;
		setTimeout(refreshDisplayVS, 1000, "1");
	};

	request.onabort= function abortCase() {
		did_timeout=1;
		document.getElementById("vs_err").innerHTML = errorHTML;
		setTimeout(refreshDisplayVS, 1000, "1");
	};

	request.timeout= 10000;
	request.open("POST", "/vs_cloud/ax_get_display.php", true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.send("force=" + force);
	if(did_timeout==0) document.getElementById("vs_err").innerHTML = " ";
}


// request an action
function reqAction(action, arg) {

	var request = new XMLHttpRequest();

	request.onload= function ok() {
		document.getElementById("vs_err").innerHTML= "+";
	};

	request.ontimeout= function timeoutCase() {
		document.getElementById("vs_err").innerHTML = timeoutHTML;
		// setTimeout(reqAction, 1000, action, url);
		};

	request.onerror= function errorCase() {
		document.getElementById("vs_err").innerHTML = errorHTML;
		// setTimeout(reqAction, 1000, action, url);
		};


	request.timeout= 5000;
	request.open("POST", "/vs_cloud/ax_action.php", true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.send("action=" + action + "&arg=" + arg);
	if(action == "display") {document.getElementById("vs_display").innerHTML=pleaseWait;forceRefresh=1;}

}

// request INPUT action
function reqInputAction(action, arg) {

	var request = new XMLHttpRequest();

	request.onload= function ok() {
		document.getElementById("vs_display").scrollTop = 0;
		document.getElementById("vs_err").innerHTML= "+";
	};

	request.ontimeout= function timeoutCase() {
		document.getElementById("vs_err").innerHTML = timeoutHTML;
		// setTimeout(reqAction, 1000, action, url);
		};

	request.onerror= function errorCase() {
		document.getElementById("vs_err").innerHTML = errorHTML;
		// setTimeout(reqAction, 1000, action, url);
		};

	user_data = document.getElementById("userinputdata").value;
	request.timeout= 5000;
	request.open("POST", "/vs_cloud/ax_action.php", true);
	request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	request.send("action=" + action + "&arg=" + arg + "&userdata=" + user_data);
	document.getElementById("vs_display").innerHTML=pleaseWait; 
	forceRefresh=1;
}






