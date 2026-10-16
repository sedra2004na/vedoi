/**
 * Speech enhancement for narrow-band (8 kHz) SVU lecture voice:
 * - Rumble high-pass filter (cuts low frequency hum)
 * - Wiener gain denoiser with decision-directed a-priori SNR & quiet frame noise floor estimation
 * - Peaking & high-shelf presence boost (restores speech clarity and crispness)
 * - Adaptive offline levelling & dynamic range compression (even loudness without pumping)
 */

// @ts-nocheck

const yieldNow = () => new Promise<void>(resolve => {
  if (typeof MessageChannel !== 'undefined') {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    channel.port2.postMessage(0);
  } else {
    setTimeout(resolve, 0);
  }
});

/* Speech clean-up for the narrow-band (8 kHz) voice: rumble filter, noise reduction, presence boost, even loudness. */
const ENH=(()=>{
function biquad(b0,b1,b2,a1,a2){return {b0,b1,b2,a1,a2,x1:0,x2:0,y1:0,y2:0};}
function runBiquad(f,x,o,n){let {b0,b1,b2,a1,a2,x1,x2,y1,y2}=f;
  for(let i=o;i<o+n;i++){const v=x[i],y=b0*v+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=v;y2=y1;y1=y;x[i]=y;}
  f.x1=x1;f.x2=x2;f.y1=y1;f.y2=y2;}
function highpass(fc,fs,q=0.7071){const w=2*Math.PI*fc/fs,c=Math.cos(w),a=Math.sin(w)/(2*q),a0=1+a;
  return biquad((1+c)/2/a0,-(1+c)/a0,(1+c)/2/a0,-2*c/a0,(1-a)/a0);}
function highshelf(fc,fs,gainDb,q=0.7071){const A=Math.pow(10,gainDb/40),w=2*Math.PI*fc/fs,c=Math.cos(w),s=Math.sin(w),al=s/(2*q),sq=2*Math.sqrt(A)*al;
  const a0=(A+1)-(A-1)*c+sq;
  return biquad(A*((A+1)+(A-1)*c+sq)/a0,-2*A*((A-1)+(A+1)*c)/a0,A*((A+1)+(A-1)*c-sq)/a0,2*((A-1)-(A+1)*c)/a0,((A+1)-(A-1)*c-sq)/a0);}
function peaking(fc,fs,gainDb,q){const A=Math.pow(10,gainDb/40),w=2*Math.PI*fc/fs,c=Math.cos(w),al=Math.sin(w)/(2*q),a0=1+al/A;
  return biquad((1+al*A)/a0,-2*c/a0,(1-al*A)/a0,-2*c/a0,(1-al/A)/a0);}
const fftTw={};
function fft(re,im){const n=re.length;
  for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
  for(let len=2;len<=n;len<<=1){let tw=fftTw[len];
    if(!tw){tw=fftTw[len]=[new Float64Array(len/2),new Float64Array(len/2)];for(let k=0;k<len/2;k++){tw[0][k]=Math.cos(-2*Math.PI*k/len);tw[1][k]=Math.sin(-2*Math.PI*k/len);}}
    const h=len>>1;
    for(let i=0;i<n;i+=len)for(let k=0;k<h;k++){const a=i+k,b=a+h,wr=tw[0][k],wi=tw[1][k];
      const xr=re[b]*wr-im[b]*wi,xi=re[b]*wi+im[b]*wr;re[b]=re[a]-xr;im[b]=im[a]-xi;re[a]+=xr;im[a]+=xi;}}}
/* noise reduction: Wiener gain with decision-directed a-priori SNR, noise floor learnt from the quietest speech-free frames */
async function denoise(x,len,strength,onP){
  const N=256,H=64,B=N/2+1,win=new Float64Array(N);
  for(let i=0;i<N;i++)win[i]=Math.sqrt(0.5-0.5*Math.cos(2*Math.PI*(i+0.5)/N));
  const nF=Math.floor((len-N)/H)+1;if(nF<8)return;
  // 1) frame energies (zero frames are pauses without any signal and are left alone)
  const en=new Float32Array(nF);const live=[];
  for(let f=0;f<nF;f++){let s=0;const o=f*H;for(let i=0;i<N;i+=2)s+=x[o+i]*x[o+i];en[f]=s;if(s>1e-9)live.push(s);}
  if(live.length<50)return;
  live.sort((a,b)=>a-b);
  const lo=live[Math.floor(live.length*0.05)],hi=live[Math.floor(live.length*0.25)];
  // 2) noise spectrum = average power of the quietest frames
  const noise=new Float64Array(B);let cnt=0;const re=new Float64Array(N),im=new Float64Array(N);
  for(let f=0;f<nF;f+=2){if(en[f]<lo||en[f]>hi)continue;const o=f*H;
    for(let i=0;i<N;i++){re[i]=x[o+i]*win[i];im[i]=0;}fft(re,im);
    for(let k=0;k<B;k++)noise[k]+=re[k]*re[k]+im[k]*im[k];cnt++;}
  if(!cnt)return;
  for(let k=0;k<B;k++)noise[k]=noise[k]/cnt*1.2+1e-12;
  // 3) filter
  const out=new Float32Array(len),prevClean=new Float64Array(B),gmin=Math.pow(10,-strength/20);
  const gain=new Float64Array(B);
  for(let f=0;f<nF;f++){
    const o=f*H;
    if(en[f]<=1e-9){prevClean.fill(0);continue;}
    for(let i=0;i<N;i++){re[i]=x[o+i]*win[i];im[i]=0;}
    fft(re,im);
    for(let k=0;k<B;k++){
      const p=re[k]*re[k]+im[k]*im[k],gamma=p/noise[k];
      const xi=0.97*(prevClean[k]/noise[k])+0.03*Math.max(gamma-1,0);
      let g=xi/(1+xi);if(g<gmin)g=gmin;gain[k]=g;
    }
    // smooth the gain across frequency to avoid isolated tonal artefacts
    let pg=gain[0];for(let k=1;k<B-1;k++){const c=gain[k];gain[k]=0.25*pg+0.5*c+0.25*gain[k+1];pg=c;}
    for(let k=0;k<B;k++){re[k]*=gain[k];im[k]*=gain[k];prevClean[k]=(re[k]*re[k]+im[k]*im[k]);if(k>0&&k<N/2){re[N-k]=re[k];im[N-k]=-im[k];}}
    // inverse FFT via conjugation
    for(let i=0;i<N;i++)im[i]=-im[i];fft(re,im);
    for(let i=0;i<N;i++)out[o+i]+=re[i]/N*win[i]/2;
    if(f%1500===0){if(onP)onP(f/nF);await yieldNow();}
  }
  // keep the untouched tail and write back
  for(let i=0;i<len;i++)x[i]=(i<(nF-1)*H+N)?out[i]:x[i];
}
/* offline levelling: loudness is measured over the speech only, smoothed over about a second, then the gain follows it */
function level(x,len,rate,targetDb,maxGainDb){
  const blk=Math.round(rate*0.02),nb=Math.floor(len/blk);
  const db=new Float32Array(nb),act=new Uint8Array(nb);
  for(let b=0;b<nb;b++){let s=0;const o=b*blk;for(let i=0;i<blk;i++)s+=x[o+i]*x[o+i];db[b]=10*Math.log10(s/blk+1e-12);}
  // gate: blocks well above the quiet floor count as speech
  const sorted=Array.from(db).filter(v=>v>-85).sort((p,q)=>p-q);if(sorted.length<20)return;
  const floorDb=sorted[Math.floor(sorted.length*0.2)],gate=Math.max(floorDb+9,-62);
  for(let b=0;b<nb;b++)act[b]=db[b]>gate?1:0;
  // smoothed speech level (weighted mean of active blocks within +-0.6 s)
  const R=30,lvl=new Float32Array(nb);let sum=0,cnt=0;
  for(let b=0;b<Math.min(R,nb);b++)if(act[b]){sum+=db[b];cnt++;}
  let last=targetDb;
  for(let b=0;b<nb;b++){
    const add=b+R,rem=b-R-1;
    if(add<nb&&act[add]){sum+=db[add];cnt++;}
    if(rem>=0&&act[rem]){sum-=db[rem];cnt--;}
    if(cnt>=6)last=sum/cnt;lvl[b]=last;
  }
  const gdb=new Float32Array(nb);
  for(let b=0;b<nb;b++)gdb[b]=Math.max(-6,Math.min(maxGainDb,targetDb-lvl[b]));
  // smooth the gain curve (~0.25 s) so there is no pumping
  const sm=new Float32Array(nb);const W=12;let acc=0;
  for(let b=0;b<Math.min(W,nb);b++)acc+=gdb[b];
  for(let b=0;b<nb;b++){const add=b+W,rem=b-W-1;if(add<nb)acc+=gdb[add];if(rem>=0)acc-=gdb[rem];
    const lo=Math.max(0,b-W),hi=Math.min(nb-1,b+W);sm[b]=acc/(hi-lo+1);}
  for(let b=0;b<nb;b++){
    const g0=Math.pow(10,(b?sm[b-1]:sm[b])/20),g1=Math.pow(10,sm[b]/20),o=b*blk;
    for(let i=0;i<blk;i++){const gg=g0+(g1-g0)*(i/blk);let v=x[o+i]*gg;
      const a=Math.abs(v);if(a>0.6)v=Math.sign(v)*(0.6+0.3*Math.tanh((a-0.6)/0.3));
      x[o+i]=v;}}
}
/** pcm is modified in place. opts: {denoise:dB, presence:dB, targetDb} */
async function enhance(pcm,len,rate,opts,onP){
  const o=Object.assign({denoise:14,presence:4,targetDb:-24,maxGainDb:14},opts||{});
  const hp=highpass(70,rate);runBiquad(hp,pcm,0,len);
  if(o.denoise>0)await denoise(pcm,len,o.denoise,onP);
  if(o.presence){runBiquad(peaking(2800,rate,o.presence*0.6,0.9),pcm,0,len);runBiquad(highshelf(2200,rate,o.presence*0.5),pcm,0,len);}
  level(pcm,len,rate,o.targetDb,o.maxGainDb);
  return pcm;
}
return {enhance};
})();

export const enhanceAudio = ENH.enhance;
export default ENH;
