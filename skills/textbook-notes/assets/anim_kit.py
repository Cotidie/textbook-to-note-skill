"""노트 애니메이션 공용 도구: 색, 좌표축, 수식, 세 박자 진행, 공분산 계산."""

import numpy as np

import manimgx as m

m.config.background_color = "#fffaf0"
INK, MUTED, ACCENT, BLUE = "#0a0a0a", "#8a8a8a", "#d9822b", "#2f6fb3"

# 왼쪽은 그림, 오른쪽은 수식과 설명을 둔다
FORMULA_POSITION = (3.4, 2.6, 0)
READOUT_POSITION = (3.4, 0.3, 0)
CAPTION_POSITION = (3.4, -1.3, 0)


def plane(extent=4.0, size=5.8, center=(-3.3, -0.2, 0)):
    return m.Axes(
        x_range=[-extent, extent, 1], y_range=[-extent, extent, 1], x_length=size, y_length=size,
        axis_config={"color": MUTED, "include_ticks": False, "stroke_width": 2},
    ).move_to(list(center))


def curve_axes(x_range, y_range, x_length=6.2, y_length=4.0, center=(-3.2, -0.2, 0)):
    return m.Axes(
        x_range=x_range, y_range=y_range, x_length=x_length, y_length=y_length,
        axis_config={"color": MUTED, "include_ticks": False, "stroke_width": 2},
    ).move_to(list(center))


def formula(*parts, at=FORMULA_POSITION, size=48):
    return m.MathTex(*parts, font_size=size, color=INK).move_to(list(at))


def cloud(axes, points, color=BLUE):
    return m.PMobject(stroke_width=5, color=color).add_points(np.array([axes.c2p(x, y) for x, y in points]))


def closed_curve(axes, points, color=ACCENT):
    return m.Polygon(*[axes.c2p(x, y) for x, y in points], color=color, stroke_width=4)


class BeatScene(m.Scene):
    """시작 고정, 변화, 끝 고정으로 진행한다. 설명 문구는 페이드로 바꾼다."""

    caption = None

    def say(self, text, at=CAPTION_POSITION, size=34):
        new_caption = m.Tex(text, font_size=size, color=INK).move_to(list(at))
        if self.caption is None:
            self.add(new_caption)
        else:
            self.play(m.FadeOut(self.caption), m.FadeIn(new_caption), run_time=0.6)
        self.caption = new_caption

    def change(self, tracker, value, light=None, run_time=4.0, rate_func=m.smooth):
        # light: 변화하는 동안 강조색으로 밝힐 수식 조각
        if light is not None:
            self.play(light.animate.set_color(ACCENT), run_time=0.3)
        self.play(tracker.animate.set_value(value), run_time=run_time, rate_func=rate_func)
        if light is not None:
            self.play(light.animate.set_color(INK), run_time=0.3)


def eigen_axes(covariance):
    # 고유값은 큰 순서로, 첫 고유벡터는 오른쪽을 향하고 U는 회전이 되도록 맞춘다
    eigenvalues, vectors = np.linalg.eigh(covariance)
    order = np.argsort(eigenvalues)[::-1]
    eigenvalues, vectors = eigenvalues[order], vectors[:, order]
    if vectors[0, 0] < 0:
        vectors[:, 0] *= -1
    if np.linalg.det(vectors) < 0:
        vectors[:, 1] *= -1
    return eigenvalues, vectors


def exact_samples(covariance, count=300, seed=5):
    # 표본 공분산이 정확히 covariance가 되도록 점구름을 만든다
    samples = np.random.default_rng(seed).standard_normal((count, 2))
    samples -= samples.mean(axis=0)
    whitened = samples @ np.linalg.inv(np.linalg.cholesky(np.cov(samples.T)).T)
    return whitened @ np.linalg.cholesky(covariance).T


def ellipse_points(covariance, radius=2.0, count=120):
    # 마할라노비스 거리가 radius인 등고선
    eigenvalues, vectors = eigen_axes(covariance)
    angle = np.linspace(0, 2 * np.pi, count)
    circle = np.stack([np.cos(angle), np.sin(angle)], axis=1)
    return circle @ np.diag(radius * np.sqrt(eigenvalues)) @ vectors.T
