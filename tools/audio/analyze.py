import sys, numpy as np, librosa
y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
tempo=float(np.atleast_1d(tempo)[0])
ib=np.diff(beats)
print('tempo',round(tempo,2),'beats',len(beats),'first',[round(b,3) for b in beats[:6]])
print('ibi median',round(float(np.median(ib)),4),'std',round(float(np.std(ib)),4),'min/max',round(float(ib.min()),3),round(float(ib.max()),3))
ch = librosa.feature.chroma_cqt(y=y, sr=sr).mean(axis=1)
names='C C# D D# E F F# G G# A A# B'.split()
maj=np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88]); mnr=np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
sc=[]
for k in range(12):
    sc.append((np.corrcoef(np.roll(maj,k),ch)[0,1],names[k]+' maj')); sc.append((np.corrcoef(np.roll(mnr,k),ch)[0,1],names[k]+' min'))
print(sorted(sc,reverse=True)[:4])
print('chroma',dict(zip(names,np.round(ch/ch.max(),2))))
# energy per 8s for structure
rms=librosa.feature.rms(y=y)[0]; t=librosa.times_like(rms,sr=sr)
print('rms/8s',[round(float(rms[(t>=s)&(t<s+8)].mean()),3) for s in range(0,160,8)])
# chord root per bar estimate
np.save('beats.npy',beats)
