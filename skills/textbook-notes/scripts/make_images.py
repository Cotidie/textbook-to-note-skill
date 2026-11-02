"""챕터의 개념 그림을 이미지 모델로 만든다.

실행: python make_images.py <figures/chNN/image_prompts.py> [그림 이름 ...]
프롬프트 파일은 FIGURES = {"그림 이름": ("가로세로 비율", "그림 내용")}을 담는다.
결과 PNG는 프롬프트 파일과 같은 폴더에 저장한다.
"""

import os
import re
import runpy
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image

MODEL = "openai/gpt-image-2.5-sunburst"
WHITE_THRESHOLD = 245


def find_generator_directory():
    # openrouter-images 스킬은 프로젝트 폴더, 사용자 폴더, 플러그인 캐시 중 어디에나 설치될 수 있다.
    # 환경 변수가 있으면 그것을 쓰고, 없으면 가까운 위치부터 찾는다. 플러그인은 가장 최근 버전을 쓴다.
    if "OPENROUTER_IMAGES_DIR" in os.environ:
        return Path(os.environ["OPENROUTER_IMAGES_DIR"])
    claude_home = Path.home() / ".claude"
    working_folders = [Path.cwd(), *Path.cwd().parents]
    candidates = [folder / ".claude" / "skills" / "openrouter-images" / "scripts" for folder in working_folders]
    candidates.append(claude_home / "skills" / "openrouter-images" / "scripts")
    plugin_copies = (claude_home / "plugins" / "cache").glob("*/*/*/skills/openrouter-images/scripts")
    candidates.extend(sorted(plugin_copies, key=lambda folder: folder.stat().st_mtime, reverse=True))
    for folder in candidates:
        if (folder / "generate.ts").exists():
            return folder
    sys.exit("openrouter-images skill not found. Install it with "
             "`gh skill install OpenRouterTeam/skills openrouter-images`, or set OPENROUTER_IMAGES_DIR "
             "to its scripts folder.")

STYLE = (
    "Clean textbook figure, flat vector style, pure white background (#ffffff). "
    "Thin dark ink lines (#0a0a0a), grey axes (#8a8a8a), one muted orange accent (#d9822b), one cool blue (#2f6fb3) for data. "
    "Every tinted area is one flat solid colour with no texture. "
    "Math labels typeset like LaTeX: italic variables, bold upright vectors, true subscripts and superscripts. "
    "Words in a clean sans-serif. All labels large enough to read at half size. "
    "No label overlaps another label, a curve, or an arrow. "
    "No gradients, no shadows, no logos, no watermark, no figure title, no figure number, no caption. "
    "Spell every quoted label exactly as written and add no other text. "
)


def save_with_transparent_white(image, output_path):
    # 흰 여백을 자르고 색 수를 줄인 뒤, 팔레트의 흰색 성분을 투명도로 바꾼다.
    # 모델의 투명 배경 모드는 색면이 얼룩져서 쓰지 않는다.
    pixels = np.array(image)
    near_white = pixels.min(axis=2) >= WHITE_THRESHOLD
    pixels[near_white] = 255
    rows, columns = np.where(~near_white)
    margin = 8
    height, width = near_white.shape
    cropped = Image.fromarray(pixels).crop((max(columns.min() - margin, 0), max(rows.min() - margin, 0),
                                            min(columns.max() + margin, width), min(rows.max() + margin, height)))
    paletted = cropped.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    palette = np.array(paletted.getpalette()).reshape(-1, 3) / 255
    alpha = 1 - palette.min(axis=1)
    alpha[alpha < 0.04] = 0
    color = (palette - (1 - alpha)[:, None]) / np.maximum(alpha, 1e-6)[:, None]
    color[alpha == 0] = 1
    paletted.putpalette((color.clip(0, 1) * 255).round().astype(np.uint8).ravel().tolist())
    paletted.save(output_path, transparency=(alpha * 255).round().astype(np.uint8).tobytes(), optimize=True)
    return paletted.size


def generate(name, aspect_ratio, content, output_directory, generator_directory):
    with tempfile.TemporaryDirectory() as temporary_directory:
        raw_path = os.path.join(temporary_directory, "raw.png")
        result = subprocess.run(
            ["npx", "tsx", "generate.ts", STYLE + content, "--model", MODEL, "--aspect-ratio", aspect_ratio,
             "--quality", "high", "--background", "opaque", "--output", raw_path],
            cwd=generator_directory, capture_output=True, text=True,
        )
        # 실패하면 생성기의 오류 문구(키 없음, 모델 오류 등)를 그대로 보여 준다.
        if result.returncode != 0:
            raise RuntimeError(f"{name}: {result.stderr.strip() or result.stdout.strip()}")
        image = Image.open(raw_path).convert("RGB")
    output_path = os.path.join(output_directory, f"{name}.png")
    width, height = save_with_transparent_white(image, output_path)
    cost = re.search(r"Cost: \$([\d.]+)", result.stderr)
    return f"{name}: {width}x{height}, {os.path.getsize(output_path) // 1024} KB, ${cost.group(1) if cost else '?'}"


def main():
    prompts_path = os.path.abspath(sys.argv[1])
    figures = runpy.run_path(prompts_path)["FIGURES"]
    names = sys.argv[2:] or list(figures)
    output_directory = os.path.dirname(prompts_path)
    generator_directory = find_generator_directory()
    with ThreadPoolExecutor(max_workers=5) as executor:
        jobs = [executor.submit(generate, name, *figures[name], output_directory, generator_directory)
                for name in names]
        for job in jobs:
            print(job.result())


if __name__ == "__main__":
    main()
