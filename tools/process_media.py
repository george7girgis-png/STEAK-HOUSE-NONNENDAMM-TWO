"""Bereitet die Rohclips für die Website auf.

Eingang  media-src/ambient/<key>.mp4, media-src/transition/<from>-<to>.mp4
Ausgang  public/media/ambient/<key>-{desktop,mobile}.mp4    (stumm, nahtloser Überblend-Loop)
         public/media/transition/<name>-{desktop,mobile}.mp4 (stumm, kurze GOP für flüssiges Scrubben)
         public/media/poster/<key>-{desktop,mobile}.jpg     (erstes Bild des Loops)

Mobile-Fassungen sind 9:16-Ausschnitte um das Essen herum (FOCUS = horizontale Mitte, 0..1).
Aufruf: python tools/process_media.py [--only key]
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "media-src"
OUT = ROOT / "public" / "media"

FOCUS = {"hero": 0.5, "hueftsteak": 0.74, "filetspiess": 0.26, "holzfaellersteak": 0.72}
TRANSITIONS = ["hero-hueftsteak", "hueftsteak-filetspiess", "filetspiess-holzfaellersteak"]
TRANSITION_SPEED = 2.0  # 5-s-Clip -> 2,5 s; Geschwindigkeit bestimmt ohnehin der Scroll


def run(args):
    print(" ".join(str(a) for a in args[:6]), "...")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def crop_expr(focus):
    # 9:16-Ausschnitt in voller Höhe, horizontal um focus zentriert, im Bild gehalten.
    return f"crop=trunc(ih*9/16/2)*2:ih:max(0\\,min(iw-ih*9/16\\,iw*{focus}-ih*9/32)):0"


X264 = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"]


LOOP_FADE = 1.0  # Sekunden Überblendung vom Clipende zurück zum Loopanfang


def loop_filter(prep, dur):
    # Loop beginnt bei LOOP_FADE; das Ende blendet in die ersten LOOP_FADE Sekunden über.
    # Letztes Bild = Bild bei LOOP_FADE = erstes Bild -> nahtlos, Flammen laufen nie rückwärts.
    f = LOOP_FADE
    return (f"[0:v]{prep},fps=24,split[x][y];"
            f"[x]trim={f}:{dur:.3f},setpts=PTS-STARTPTS[a];"
            f"[y]trim=0:{f},setpts=PTS-STARTPTS[b];"
            f"[a][b]xfade=transition=fade:duration={f}:offset={dur - 2 * f:.3f}")


def probe_duration(path):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True).stdout.strip())


def ambient(key):
    src = SRC / "ambient" / f"{key}.mp4"
    dur = probe_duration(src) - 0.05
    (OUT / "ambient").mkdir(parents=True, exist_ok=True)
    (OUT / "poster").mkdir(parents=True, exist_ok=True)
    for variant, prep in (("desktop", "scale=1920:-2"), ("mobile", f"{crop_expr(FOCUS[key])},scale=720:-2")):
        run(["-i", src, "-filter_complex", loop_filter(prep, dur),
             *X264, "-preset", "slow", "-crf", "25", "-g", "48",
             OUT / "ambient" / f"{key}-{variant}.mp4"])
        run(["-ss", str(LOOP_FADE), "-i", src, "-vf", prep, "-frames:v", "1", "-q:v", "4",
             OUT / "poster" / f"{key}-{variant}.jpg"])


def transition(name):
    src = SRC / "transition" / f"{name}.mp4"
    a, b = name.split("-")
    fa, fb = FOCUS[a], FOCUS[b]
    (OUT / "transition").mkdir(parents=True, exist_ok=True)
    speed = f"setpts=PTS/{TRANSITION_SPEED},fps=24"
    run(["-i", src, "-vf", f"{speed},scale=1280:-2", *X264, "-preset", "slow", "-crf", "26",
         "-g", "3", "-keyint_min", "1", "-bf", "0", OUT / "transition" / f"{name}-desktop.mp4"])
    # Mobile: Ausschnitt wandert während des Übergangs von Essen A zu Essen B.
    dur = probe_duration(src)
    focus = f"({fa}+({fb}-{fa})*min(1\\,t/{dur:.3f}))"
    crop = f"crop=trunc(ih*9/16/2)*2:ih:max(0\\,min(iw-ih*9/16\\,iw*{focus}-ih*9/32)):0"
    run(["-i", src, "-vf", f"{crop},{speed},scale=540:-2", *X264, "-preset", "slow", "-crf", "26",
         "-g", "3", "-keyint_min", "1", "-bf", "0", OUT / "transition" / f"{name}-mobile.mp4"])


if __name__ == "__main__":
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    for k in FOCUS:
        if (only in (None, k)) and (SRC / "ambient" / f"{k}.mp4").exists():
            ambient(k)
    for t in TRANSITIONS:
        if (only in (None, t)) and (SRC / "transition" / f"{t}.mp4").exists():
            transition(t)
