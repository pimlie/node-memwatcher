#!/usr/bin/env bash

# speed up video, 10s target
#ffmpeg -i demo.mp4 -vf "setpts=0.06*PTS" output.mp4
cp demo2.mp4 output.mp4

# create palette
ffmpeg -y -i output.mp4 -vf fps=10,scale=800:-1:flags=lanczos,palettegen palette.png

# convert to gif
ffmpeg -i output.mp4 -i palette.png -filter_complex "fps=10,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse" demo2.gif

rm output.mp4
rm palette.png
