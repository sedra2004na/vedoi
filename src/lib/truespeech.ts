/**
 * TrueSpeech 8.5 decoder, ported from FFmpeg libavcodec/truespeech.c (LGPL-2.1+, (c) 2005 Konstantin Shishkov)
 * Used by Linktivity / SVU player to decode 8.5 kbps voice packets into 8 kHz PCM audio.
 */

// @ts-nocheck
const TS=(()=>{
const ts_cb_0=Int16Array.of(-32192,-31900,-31538,-31139,-30715,-30242,-29737,-29196,-28591,-27934,-27170,-26353,-25471,-24455,-23220,-21806,-20086,-18166,-16092,-13876,-11463,-8749,-5674,-1901,2415,6858,10732,14367,17913,21610,25539,29621);
const ts_cb_1=Int16Array.of(-24731,-19093,-14973,-11407,-8168,-5196,-2532,-167,2139,4358,6482,8522,10441,12280,14054,15762,17375,18875,20294,21607,22832,23971,25068,26105,27092,27994,28830,29613,30315,30960,31578,32165);
const ts_cb_2=Int16Array.of(-26888,-23628,-20667,-17837,-15183,-12596,-10129,-7650,-5133,-2496,247,3104,6273,9882,14187,19808);
const ts_cb_3=Int16Array.of(-14764,-8462,-4182,-620,2410,5183,7803,10284,12662,14985,17311,19618,21887,24144,26392,28557);
const ts_cb_4=Int16Array.of(-21529,-17496,-14308,-11482,-8946,-6700,-4574,-2536,-472,1615,3767,6072,8618,11659,15266,19961);
const ts_cb_5=Int16Array.of(-10981,-3794,1070,5063,8800,12571,16606,21381);
const ts_cb_6=Int16Array.of(-19120,-14299,-9856,-5737,-1917,1874,6161,11800);
const ts_cb_7=Int16Array.of(-12560,-6919,-2373,1606,5365,9215,13679,19085);
const ts_pulse_values=Int16Array.of(3654,3276,2925,2600,2300,2024,1771,1540,1330,1140,969,816,680,560,455,364,286,220,165,120,84,56,35,20,10,4,1,0,0,0,406,378,351,325,300,276,253,231,210,190,171,153,136,120,105,91,78,66,55,45,36,28,21,15,10,6,3,1,0,0,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1);
const ts_decay_994_1000=Int16Array.of(32571,32376,32182,31989,31797,31606,31416,31228);
const ts_order2_coeffs=Int16Array.of(-4817,21049,21745,-6999,9760,-4546,2518,11328,-4171,11232,16353,13113,17455,-6402,17496,-1569,-3535,17371,15792,-2299,20347,-261,9901,3292,13250,1849,4798,17314,7135,7998,529,1942,10987,5695,1293,14904,3358,3448,5391,13126,14500,2941,11613,8159,6583,10274,3481,7954,6476,3302);
const ts_pulse_scales=Int16Array.of(2,6,-2,-6,4,12,-4,-12,6,18,-6,-18,10,30,-10,-30,16,48,-16,-48,25,75,-25,-75,40,120,-40,-120,64,192,-64,-192,101,303,-101,-303,161,483,-161,-483,256,768,-256,-768,406,1218,-406,-1218,645,1935,-645,-1935,1024,3072,-1024,-3072,1625,4875,-1625,-4875,2580,7740,-2580,-7740);
const ts_decay_35_64=Int16Array.of(18022,9912,5452,2998,1649,907,499,274);
const ts_decay_3_4=Int16Array.of(24576,18432,13824,10368,7776,5832,4374,3281);
const CB=[ts_cb_0,ts_cb_1,ts_cb_2,ts_cb_3,ts_cb_4,ts_cb_5,ts_cb_6,ts_cb_7];
const clip=(v,a,b)=>v<a?a:v>b?b:v;
class Decoder{
  constructor(){
    this.vector=new Int16Array(8);this.offset1=[0,0];this.offset2=[0,0,0,0];this.pulseoff=[0,0,0,0];this.pulsepos=[0,0,0,0];this.pulseval=[0,0,0,0];this.flag=0;
    this.filtbuf=new Int32Array(146);this.prevfilt=new Int32Array(8);
    this.tmp1=new Int16Array(8);this.tmp2=new Int16Array(8);this.tmp3=new Int16Array(8);
    this.cvector=new Int16Array(8);this.filtval=0;this.newvec=new Int16Array(60);this.filters=new Int16Array(32);
    this.buf=new Uint8Array(32);this.pos=0;
  }
  bits(n){let v=0;while(n>0){const byte=this.buf[this.pos>>3],avail=8-(this.pos&7),take=Math.min(avail,n);
    v=v*(1<<take)+((byte>>(avail-take))&((1<<take)-1));this.pos+=take;n-=take;}return v;}
  readFrame(inp,off){
    for(let i=0;i<8;i++)for(let j=0;j<4;j++)this.buf[i*4+j]=inp[off+i*4+3-j];
    this.pos=0;const v=this.vector;
    v[7]=CB[7][this.bits(3)];v[6]=CB[6][this.bits(3)];v[5]=CB[5][this.bits(3)];v[4]=CB[4][this.bits(4)];
    v[3]=CB[3][this.bits(4)];v[2]=CB[2][this.bits(4)];v[1]=CB[1][this.bits(5)];v[0]=CB[0][this.bits(5)];
    this.flag=this.bits(1);
    this.offset1[0]=this.bits(4)<<4;
    this.offset2[3]=this.bits(7);this.offset2[2]=this.bits(7);this.offset2[1]=this.bits(7);this.offset2[0]=this.bits(7);
    this.offset1[1]=this.bits(4);
    this.pulseval[1]=this.bits(14);this.pulseval[0]=this.bits(14);
    this.offset1[1]|=this.bits(4)<<4;
    this.pulseval[3]=this.bits(14);this.pulseval[2]=this.bits(14);
    this.offset1[0]|=this.bits(1);
    this.pulsepos[0]=this.bits(27);this.pulseoff[0]=this.bits(4);
    this.offset1[0]|=this.bits(1)<<1;
    this.pulsepos[1]=this.bits(27);this.pulseoff[1]=this.bits(4);
    this.offset1[0]|=this.bits(1)<<2;
    this.pulsepos[2]=this.bits(27);this.pulseoff[2]=this.bits(4);
    this.offset1[0]|=this.bits(1)<<3;
    this.pulsepos[3]=this.bits(27);this.pulseoff[3]=this.bits(4);
  }
  correlate(){
    const cv=this.cvector,vec=this.vector,tmp=new Int16Array(8);
    for(let i=0;i<8;i++){
      if(i>0){for(let j=0;j<i;j++)tmp[j]=cv[j];
        for(let j=0;j<i;j++)cv[j]+=(tmp[i-j-1]*vec[i]+0x4000)>>15;}
      cv[i]=(8-vec[i])>>3;
    }
    for(let i=0;i<8;i++)cv[i]=(cv[i]*ts_decay_994_1000[i])>>15;
    this.filtval=vec[0];
  }
  merge(){
    const f=this.filters,cv=this.cvector,pf=this.prevfilt;
    if(!this.flag){for(let i=0;i<8;i++){f[i]=pf[i];f[i+8]=pf[i];}}
    else{for(let i=0;i<8;i++){f[i]=(cv[i]*21846+pf[i]*10923+16384)>>15;f[i+8]=(cv[i]*10923+pf[i]*21846+16384)>>15;}}
    for(let i=0;i<8;i++){f[i+16]=cv[i];f[i+24]=cv[i];}
  }
  twopoint(q){
    let t=this.offset2[q];
    if(t===127){this.newvec.fill(0);return;}
    const tmp=new Int16Array(206);
    for(let i=0;i<146;i++)tmp[i]=this.filtbuf[i];
    let off=((t/25)|0)+this.offset1[q>>1]+18;off=clip(off,0,145);
    let p0=145-off;const f0=ts_order2_coeffs[(t%25)*2],f1=ts_order2_coeffs[(t%25)*2+1];
    for(let i=0;i<60;i++){
      t=(tmp[p0]*f0+tmp[p0+1]*f1+0x2000)>>14;p0++;
      this.newvec[i]=t;tmp[146+i]=t;
    }
  }
  pulses(out,o,q){
    for(let i=0;i<60;i++)out[o+i]=0;
    const tmp=new Int16Array(7);
    for(let i=0;i<7;i++){const t=this.pulseval[q]&3;this.pulseval[q]>>=2;tmp[6-i]=ts_pulse_scales[this.pulseoff[q]*4+t];}
    let coef=this.pulsepos[q]>>15,p1=30,p2=0,j=3;
    for(let i=0;i<30&&j>0;i++){const t=ts_pulse_values[p1++];
      if(coef>=t)coef-=t;else{out[o+i]=tmp[p2++];p1+=30;j--;}}
    coef=this.pulsepos[q]&0x7FFF;p1=0;j=4;
    for(let i=30;i<60&&j>0;i++){const t=ts_pulse_values[p1++];
      if(coef>=t)coef-=t;else{out[o+i]=tmp[p2++];p1+=30;j--;}}
  }
  update(out,o){
    this.filtbuf.copyWithin(0,60,146);
    for(let i=0;i<60;i++){const nv=this.newvec[i];this.filtbuf[i+86]=out[o+i]+nv-(nv>>3);out[o+i]+=nv;}
  }
  synth(out,o,q){
    const p1=q*8,flt=this.filters,t=new Int32Array(8);
    let p0=this.tmp1;
    for(let i=0;i<60;i++){
      let sum=0;for(let k=0;k<8;k++)sum=(sum+Math.imul(p0[k],flt[p1+k]))|0;
      sum=out[o+i]+((((sum+0x800)|0))>>12);
      out[o+i]=clip(sum,-0x7FFE,0x7FFE);
      for(let k=7;k>0;k--)p0[k]=p0[k-1];p0[0]=out[o+i];
    }
    for(let i=0;i<8;i++)t[i]=(ts_decay_35_64[i]*flt[p1+i])>>15;
    p0=this.tmp2;
    for(let i=0;i<60;i++){
      let sum=0;for(let k=0;k<8;k++)sum=(sum+Math.imul(p0[k],t[k]))|0;
      for(let k=7;k>0;k--)p0[k]=p0[k-1];p0[0]=out[o+i];
      out[o+i]+=(-sum)>>12;
    }
    for(let i=0;i<8;i++)t[i]=(ts_decay_3_4[i]*flt[p1+i])>>15;
    p0=this.tmp3;const fv=this.filtval;
    for(let i=0;i<60;i++){
      let sum=out[o+i]*4096;
      for(let k=0;k<8;k++)sum=(sum+Math.imul(p0[k],t[k]))|0;
      for(let k=7;k>0;k--)p0[k]=p0[k-1];
      p0[0]=clip((sum+0x800)>>12,-0x7FFE,0x7FFE);
      sum=(((p0[1]*(fv-(fv>>2)))>>4)+sum)|0;
      sum=sum-(sum>>3);
      out[o+i]=clip((sum+0x800)>>12,-0x7FFE,0x7FFE);
    }
  }
  /** decode `frames` 32-byte blocks starting at inp[off]; returns Int16Array(frames*240) */
  decode(inp,off,frames){
    const out=new Int16Array(frames*240);
    for(let j=0;j<frames;j++){
      this.readFrame(inp,off+j*32);this.correlate();this.merge();
      for(let q=0;q<4;q++){const o=j*240+q*60;this.twopoint(q);this.pulses(out,o,q);this.update(out,o);this.synth(out,o,q);}
      for(let i=0;i<8;i++)this.prevfilt[i]=this.cvector[i];
    }
    return out;
  }
}
return {Decoder};
})();

export const TrueSpeechDecoder = TS.Decoder;
export default TS;
