"""Animation N.M: <the claim this animation shows, in one line> (Sec. N.k, Eq. N.k-j)."""

import os
import sys

import numpy as np

sys.path.insert(0, os.path.expanduser("~/.claude/skills/textbook-notes/assets"))
import manimgx as m  # noqa: E402
from anim_kit import ACCENT, READOUT_POSITION, BeatScene, formula, plane  # noqa: E402


class SceneName(BeatScene):
    def construct(self) -> None:
        # 변하는 양은 하나. 움직이는 것은 모두 여기서 계산한다.
        knob = m.ValueTracker(0.0)
        axes = plane()

        def picture():
            return axes.plot(lambda x: np.exp(-((x - knob.get_value()) ** 2) / 2), x_range=[-4, 4], color=ACCENT, stroke_width=4)

        equation = formula(r"f(x) = ", r"e^{-(x-\mu)^2/2}")
        readout = m.always_redraw(lambda: formula(r"\mu = %.2f" % knob.get_value(), at=READOUT_POSITION, size=40))

        # 시작 상태
        self.add(axes, m.always_redraw(picture), equation, readout)
        self.say(r"start state, in words")
        self.wait(2)

        # 변화 하나
        self.say(r"$\mu$ grows: the bell slides right")
        self.change(knob, 2.0, light=equation[1])

        # 끝 상태. 마지막 프레임이 포스터가 된다.
        self.wait(2)
