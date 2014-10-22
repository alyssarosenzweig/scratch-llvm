/*
maintains a Scratch project in memory,
with JSON serialization support
*/

function Meow() {

}

Meow.prototype.serialize = function() {
	// I extracted this from the Scratch Wiki; when it breaks, you can blame veggie
	
	return
		{
		    "objName": "Stage",
		    "costumes": [{
		            "costumeName": "backdrop1",
		            "baseLayerID": 1,
		            "baseLayerMD5": "510da64cf172d53750dffd23fbf73563.png",
		            "bitmapResolution": 1,
		            "rotationCenterX": 240,
		            "rotationCenterY": 180
		        }],
		    "currentCostumeIndex": 0,
		    "penLayerMD5": "279467d0d49e152706ed66539b577c00.png",
		    "tempoBPM": 60,
		    "videoAlpha": 0.5,
		    "children": [],
		    "info": {
		        "scriptCount": 0,
		        "flashVersion": "MAC 11,8,800,94",
		        "spriteCount": 0,
		        "swfVersion": "v341",
		        "videoOn": false,
		        "projectID": "11175527",
		        "userAgent": "Mozilla\/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit\/537.36 (KHTML, like Gecko) Chrome\/30.0.1552.0 Safari\/537.36",
		        "hasCloudData": false
		    }
		}
}

module.exports = function() {
	return (new Meow());
}