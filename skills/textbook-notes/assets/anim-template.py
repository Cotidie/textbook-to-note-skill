"""Animation N.M: <why the mechanism holds, in one line> (Sec. N.k, Eq. N.k-j)."""

import manimgx as m
import numpy as np

# anim_kit은 스킬의 assets 폴더에 있다. manimgx를 PYTHONPATH=<skill-dir>/assets로 실행해야 찾는다.
from anim_kit import ACCENT, READOUT_POSITION, BeatScene, formula, plane


class SceneName(BeatScene):
    def construct(self) -> None:
        # 단계마다 tracker 하나. 움직이는 것은 모두 tracker에서 계산한다.
        mean = m.ValueTracker(0.0)
        spread = m.ValueTracker(1.0)
        axes = plane()

        def picture():
            mu, sigma = mean.get_value(), spread.get_value()
            return axes.plot(lambda x: np.exp(-(((x - mu) / sigma) ** 2) / 2), x_range=[-4, 4], color=ACCENT, stroke_width=4)

        equation = formula(r"f(x) = ", r"e^{-(x-\mu)^2", r"/2\sigma^2}")
        readout = m.always_redraw(lambda: formula(r"\mu = %.2f,\ \sigma = %.2f" % (mean.get_value(), spread.get_value()), at=READOUT_POSITION, size=40))

        # 시작 상태
        self.add(axes, m.always_redraw(picture), equation, readout)
        self.say(r"start state, in words")
        self.wait(2)

        # 단계마다 자막이 바뀌는 것 하나를 말하고, 그 항이 밝아진다
        self.stage(r"stage 1: $\mu$ grows, the bell slides right", mean, 2.0, light=equation[1])
        self.stage(r"stage 2: $\sigma$ grows, the bell widens", spread, 1.6, light=equation[2])

        # 끝 상태. 마지막 프레임이 포스터가 된다.
        self.say(r"what the stages add up to")
        self.wait(2)
