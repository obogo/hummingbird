/*
var color1 = "rgb(114,93,20)";
var color2 = "rgb(114,93,20,0.37423)";
var color3 = "#67DAF0";
var color4 = "#5567DAF0";
var color5 = "#F3A";
var color6 = "#DF3A";
var color7 = "rgb(75,200,112)";
var color8 = "rgb(75,200,112,0.98631)";
var c;

// Shade (Lighten or Darken)
c = shadeBlendConvert(0.3,color1); // rgb(114,93,20) + [30% Lighter] => rgb(156,142,91)
c = shadeBlendConvert(-0.13,color5); // #F3A + [13% Darker]  => #de2c94
// Shade with Conversion (use 'c' as your 'to' color)
c = shadeBlendConvert(0.42,color2,"c"); //rgb(114,93,20,0.37423) + [42% Lighter] + [Convert] => #5fada177
// RGB2Hex & Hex2RGB Conversion Only (set percentage to zero)
c = shadeBlendConvert(0,color6,"c"); // #DF3A + [Convert] => rgb(255,51,170,0.8667)
// Blending
c = shadeBlendConvert(-0.13,color2,color8); // rgb(114,93,20,0.37423) + rgb(75,200,112,0.98631) + [13% Blend] => rgb(109,107,32,0.4538)
c = shadeBlendConvert(0.65,color2,color7); // rgb(114,93,20,0.37423) + rgb(75,200,112) + [65% Blend] => rgb(89,163,80,0.37423)
// Blending with Conversion  (result is in the 'to' color format)
c = shadeBlendConvert(0.3,color1,color3); // rgb(114,93,20) + #67DAF0 + [30% Blend] + [Convert] => #6f8356
c = shadeBlendConvert(-0.13,color4,color2); // #5567DAF0 + rgb(114,93,20,0.37423) + [13% Blend] + [Convert] => rgb(104,202,211,0.3386)
// Error Checking
c = shadeBlendConvert(0.3,"#FFBAA"); // #FFBAA + [30% Lighter] => null
c = shadeBlendConvert(30,color1,color5); // rgb(114,93,20) + #F3A + [3000% Blend] => null
// A pound of salt is jibberish  (Error Check Fail)
c = shadeBlendConvert(0.3,"#salt");  // #salt + [30% Lighter] => #004d4d4d
// Ripping
c = sbcRip(color4); // #5567DAF0 + [Rip] =>> {0:103,1:218,2:240,3:0.3333}
 */
define('shadeBlend', function() {
    //http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
    return function shadeBlendConvert(p, from, to) {
        if(typeof(p)!="number"||p<-1||p>1||typeof(from)!="string"||(from[0]!='r'&&from[0]!='#')||(typeof(to)!="string"&&typeof(to)!="undefined"))return null; //ErrorCheck
        if(!this.sbcRip)this.sbcRip=function(d){
            var l=d.length,RGB=new Object();
            if(l>9){
                d=d.split(",");
                if(d.length<3||d.length>4)return null;//ErrorCheck
                RGB[0]=i(d[0].slice(4)),RGB[1]=i(d[1]),RGB[2]=i(d[2]),RGB[3]=d[3]?parseFloat(d[3]):-1;
            }else{
                if(l==8||l==6||l<4)return null; //ErrorCheck
                if(l<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(l>4?d[4]+""+d[4]:""); //3 digit
                d=i(d.slice(1),16),RGB[0]=d>>16&255,RGB[1]=d>>8&255,RGB[2]=d&255,RGB[3]=l==9||l==5?r(((d>>24&255)/255)*10000)/10000:-1;
            }
            return RGB;
        };
        var i=parseInt,r=Math.round,h=from.length>9,h=typeof(to)=="string"?to.length>9?true:to=="c"?!h:false:h,b=p<0,p=b?p*-1:p,to=to&&to!="c"?to:b?"#000000":"#FFFFFF",f=this.sbcRip(from),t=this.sbcRip(to);
        if(!f||!t)return null; //ErrorCheck
        if(h)return "rgb("+r((t[0]-f[0])*p+f[0])+","+r((t[1]-f[1])*p+f[1])+","+r((t[2]-f[2])*p+f[2])+(f[3]<0&&t[3]<0?")":","+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*10000)/10000:t[3]<0?f[3]:t[3])+")");
        else return "#"+(0x100000000+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*255):t[3]>-1?r(t[3]*255):f[3]>-1?r(f[3]*255):255)*0x1000000+r((t[0]-f[0])*p+f[0])*0x10000+r((t[1]-f[1])*p+f[1])*0x100+r((t[2]-f[2])*p+f[2])).toString(16).slice(f[3]>-1||t[3]>-1?1:3);
    };
});