#!/usr/bin/env python3
"""Fabrica la tira de cuadros de la explosión del duelo de MafiaTCG (el ataque de Perro de Mierda, fx:"explosion").
   No sale de ningún video ni GIF: es ruido, una bola que crece y una rampa de colores. Queda con pinta de GIF viejo
   (pocos colores, píxel grande) a propósito. Son 20 cuadros de 128 px en fila: la arena los pasa de a saltos
   (.ar-boom, steps(20)); si cambia la cantidad de cuadros hay que cambiarla también ahí.

     python3 .github/scripts/explosion.py                 escribe fotos/t3/tcg/explosion.webp
     python3 .github/scripts/explosion.py salida.webp     en otro lado
     python3 .github/scripts/explosion.py salida.webp lamina.png     además, una lámina para mirar los cuadros

   Necesita numpy y Pillow. Con la misma semilla sale siempre igual."""
import sys, os, numpy as np
from PIL import Image
N=20            # cuadros
T=128           # lado de cada cuadro
rng=np.random.default_rng(1912)

def ruido3(nt,n,celdas):
    """ruido suave en (tiempo, y, x): una grilla al azar de 'celdas' por lado, agrandada con bicúbica, mezclada en el tiempo"""
    capas=[np.asarray(Image.fromarray((rng.random((celdas,celdas))*255).astype(np.uint8)).resize((n,n),Image.BICUBIC),dtype=np.float32)/255 for _ in range(nt)]
    return capas
def en_t(capas,t):
    """t en [0,1] → interpolación entre capas"""
    x=t*(len(capas)-1); i=int(np.floor(x)); f=x-i
    if i>=len(capas)-1: return capas[-1]
    f=f*f*(3-2*f)
    return capas[i]*(1-f)+capas[i+1]*f
def suave(a,b,x): 
    t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)

yy,xx=np.mgrid[0:T,0:T].astype(np.float32)
cx,cy=T/2,T*0.56
X=(xx-cx)/(T/2); Y=(yy-cy)/(T/2)
ang=np.arctan2(Y,X)
G=ruido3(7,T,5); M=ruido3(9,T,9); F=ruido3(11,T,18)      # grueso, medio, fino
# la rampa de colores, de frío a caliente
RAMPA=np.array([[38,34,36],[70,58,56],[104,52,34],[176,56,22],[232,96,20],[250,150,28],[255,206,70],[255,240,170],[255,255,246]],dtype=np.float32)
def color(calor):
    x=np.clip(calor,0,1)*(len(RAMPA)-1); i=np.clip(np.floor(x).astype(int),0,len(RAMPA)-2); f=(x-i)[...,None]
    return RAMPA[i]*(1-f)+RAMPA[i+1]*f
# esquirlas: salen del centro en los primeros cuadros
esq=[(rng.uniform(0,2*np.pi),rng.uniform(.75,1.25),rng.uniform(.012,.03)) for _ in range(26)]
cuadros=[]
for k in range(N):
    t=k/(N-1)
    g=en_t(G,t); m=en_t(M,min(1,t*1.15)); f=en_t(F,t)
    n=(g*.5+m*.33+f*.17)                                   # ~[0,1]
    sube=t*.34                                              # el humo sube
    r=np.sqrt((X*1.02)**2+((Y+sube*(.4+.6*suave(.25,1,t)))*1.06)**2)
    R=.16+.74*(1-(1-min(1,t*1.9))**3)                      # el frente: crece rápido y se planta
    borde=R*(.72+.56*n)                                     # borde desparejo
    masa=suave(0,.16,borde-r)                               # 1 adentro
    # huecos que la van comiendo cuando se enfría: primero los bordes y donde el ruido es flojo
    dens=n*.62+m*.38+(1-np.clip(r/max(R,.01),0,1.4))*.34
    umbral=.18+suave(.34,1.0,t)*.86
    huecos=suave(umbral+.05,umbral-.05,dens)                # 1 donde ya no queda nada
    alfa=masa*(1-huecos)
    alfa*=1-suave(.86,1.0,t)                                # al final se va
    # calor: mucho al principio y en el centro; después solo brasas adentro
    centro=np.clip(1-r/max(borde.max(),.01),0,1)
    calor=(1-t*1.25)*.62+centro*(.75-t*.55)+(n-.5)*.5
    calor=np.clip(calor,0,1)*(1-suave(.42,.8,t)*.86)
    calor=np.maximum(calor,.04+.11*n)                       # el humo no llega a negro
    if k==0:
        calor=np.maximum(calor,.97*suave(.5,0,r/.34)); alfa=np.maximum(alfa,suave(.36,.2,r))
    rgb=color(calor)
    # el humo se va aclarando a gris a medida que se disipa
    gris=suave(.5,1.0,t)*np.clip(1-calor*3.2,0,1)*.55
    rgb=rgb*(1-gris[...,None])+np.array([112,106,104],dtype=np.float32)*gris[...,None]
    # anillo de la onda, los primeros cuadros
    if t<.36:
        ra=.2+t*2.5; an=np.exp(-((r-ra)/.045)**2)*(1-t/.36)*.8
        rgb=rgb*(1-an[...,None])+np.array([255,244,214],dtype=np.float32)*an[...,None]; alfa=np.maximum(alfa,an*.85)
    # esquirlas
    if t<.5:
        for a,v,w in esq:
            d=(.18+t*2.3*v); ex,ey=np.cos(a)*d,np.sin(a)*d*.92-(.0)+t*t*.5
            e=np.exp(-(((X-ex)**2+(Y-ey)**2)/(w*w*(1.6-t*2))))*(1-t/.5)
            rgb=rgb*(1-e[...,None])+np.array([255,226,120],dtype=np.float32)*e[...,None]; alfa=np.maximum(alfa,e)
    a8=np.clip(alfa,0,1)
    a8=np.where(a8<.12,0,np.where(a8<.4,.55,1.0))           # borde duro, de GIF
    cuadros.append(np.dstack([np.clip(rgb,0,255),a8*255]).astype(np.uint8))
tira=np.concatenate(cuadros,axis=1)
im=Image.fromarray(tira,"RGBA")
# pocos colores, como un GIF
rgb=im.convert("RGB").quantize(colors=28,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert("RGB")
im=Image.merge("RGBA",(*rgb.split(),im.split()[3]))
sal=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","..","fotos","t3","tcg","explosion.webp")
im.save(sal,lossless=True,method=6)
print(os.path.normpath(sal),im.size,N,"cuadros")
if len(sys.argv)>2:
    # una lámina para mirarla: los cuadros en dos filas, agrandados, sobre el azul de la arena
    esc=2; cols=10
    lam=Image.new("RGB",(cols*T*esc,2*T*esc),(23,28,77))
    for k in range(N):
        c=im.crop((k*T,0,(k+1)*T,T)).resize((T*esc,T*esc),Image.NEAREST)
        lam.paste(c,((k%cols)*T*esc,(k//cols)*T*esc),c)
    lam.save(sys.argv[2])
