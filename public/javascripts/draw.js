!(function(){
	var lotteryArr = ['123','1192','234','1234','4523'] ;
	var timer ;
	console.log("this is draw.js ...",$) ;
	//点击修改本次产品
	$(".award-event").on('click' , function(){
		console.log("点击修改本次产品...") ;
	}) ;

	//开始抽奖
	$(".win-button").on('click' , function(){
		var arrLength = lotteryArr.length ;
		if( 'start' == $(this).attr("action") ){
			$(this).attr("action","stop").html("结束抽奖") ;
			timer = setInterval(function(){
				var arrIndex = Math.floor(Math.random()*arrLength) ;
				$(".win-code").html(lotteryArr[arrIndex]) ;
				console.log("arrIndex:" , arrIndex) ;
				console.log(lotteryArr[arrIndex]) ;
			},100) ;
			console.log("开始抽奖") ;
		}else{
			$(this).attr("action","start").html("开始抽奖") ;
			clearInterval(timer) ;
			console.log("结束抽奖") ;
		}
		console.log("点击开始抽奖...",$(this).attr("action")) ;
	}) ;

	//导入奖池
	$("#xlf").on('change' , function(e){
		do_file(e.target.files);
		
	}) ;

	//从excel导入数据的util
	var X = XLSX;
	var XW = {
		msg: 'xlsx',
		worker: './javascripts/xlsxworker.js'
	};
	
	var process_wb = (function() {
		var get_format = (function() {
			var radios = document.getElementsByName( "format" );
			return function() {
				for(var i = 0; i < radios.length; ++i) if(radios[i].checked || radios.length === 1) return radios[i].value;
			};
		})();

		var to_json = function to_json(workbook) {
			var result = {};
			workbook.SheetNames.forEach(function(sheetName) {
				var roa = X.utils.sheet_to_json(workbook.Sheets[sheetName]);
				if(roa.length) result[sheetName] = roa;
			});
			return JSON.stringify(result, 2, 2);
		};

		var to_csv = function to_csv(workbook) {
			var result = [];
			workbook.SheetNames.forEach(function(sheetName) {
				var csv = X.utils.sheet_to_csv(workbook.Sheets[sheetName]);
				if(csv.length){
					result.push("SHEET: " + sheetName);
					result.push("");
					result.push(csv);
				}
			});
			return result.join("\n");
		};

		var to_fmla = function to_fmla(workbook) {
			var result = [];
			workbook.SheetNames.forEach(function(sheetName) {
				var formulae = X.utils.get_formulae(workbook.Sheets[sheetName]);
				if(formulae.length){
					result.push("SHEET: " + sheetName);
					result.push("");
					result.push(formulae.join("\n"));
				}
			});
			return result.join("\n");
		};

		var to_html = function to_html(workbook) {
			workbook.SheetNames.forEach(function(sheetName) {
				var htmlstr = X.write(workbook, {sheet:sheetName, type:'binary', bookType:'html'});
			});
			return "";
		};

		return function process_wb(wb) {
			global_wb = wb;
			var output = "";
			switch(get_format()) {
				case "form": output = to_fmla(wb); break;
				case "html": output = to_html(wb); break;
				case "json": output = to_json(wb); break;
				default: output = to_csv(wb);
			}
			lotteryArr = output ;
			var lotteryCount = "奖池共"+(lotteryArr.length||0)+"条记录"

			$(".win-pre-first").text("目前奖池第一条记录为：" , lotteryArr[0]) ;
			$(".win-pre-end").text("最后一条记录为：" , lotteryArr[lotteryArr.length-1]) ;
			$(".win-pre-count").text(lotteryCount) ;
			console.log("lotteryArr:" , lotteryArr) ;
		};
	})();
	
	var do_file = (function() {
		var rABS = typeof FileReader !== "undefined" && (FileReader.prototype||{}).readAsBinaryString;
		
		var use_worker = typeof Worker !== 'undefined';

		var xw = function xw(data, cb) {
			var worker = new Worker(XW.worker);
			worker.onmessage = function(e) {
				switch(e.data.t) {
					case 'ready': break;
					case 'e': console.error(e.data.d); break;
					case XW.msg: cb(JSON.parse(e.data.d)); break;
				}
			};
			worker.postMessage({d:data,b:rABS?'binary':'array'});
		};

		return function do_file(files) {
			var f = files[0];
			var reader = new FileReader();
			reader.onload = function(e) {
				if(typeof console !== 'undefined') console.log("onload", new Date(), rABS, use_worker);
				var data = e.target.result;
				if(!rABS) data = new Uint8Array(data);
				if(use_worker) xw(data, process_wb);
				else process_wb(X.read(data, {type: rABS ? 'binary' : 'array'}));
			};
			if(rABS) !!f ? reader.readAsBinaryString(f) : '';
			else reader.readAsArrayBuffer(f);
		};
	})();
})()