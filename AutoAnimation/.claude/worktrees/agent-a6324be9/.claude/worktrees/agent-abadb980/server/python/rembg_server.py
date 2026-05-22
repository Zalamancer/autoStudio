"""
Minimal Flask server wrapping rembg for background removal.
Spawned automatically by the Express server as a child process.

POST /remove  — accepts JSON { "image": "<base64 PNG>" }, returns { "image": "<base64 PNG>" }
GET  /health  — returns { "status": "ok" }
"""

import base64
import sys

from flask import Flask, request, jsonify
from rembg import new_session, remove

app = Flask(__name__)

# isnet-anime: trained on anime/cartoon/illustration content — best for character sprites
session = new_session("isnet-anime")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/remove", methods=["POST"])
def remove_bg():
    data = request.get_json(silent=True)
    if not data or "image" not in data:
        return jsonify({"error": "Missing 'image' field (base64 PNG)"}), 400

    try:
        input_bytes = base64.b64decode(data["image"])
        # Pass raw bytes — rembg handles format detection internally
        # alpha_matting smooths edges, post_process_mask cleans up the mask
        output_bytes = remove(
            input_bytes,
            session=session,
            post_process_mask=True,
            alpha_matting=True,
            alpha_matting_foreground_threshold=240,
            alpha_matting_background_threshold=10,
            alpha_matting_erode_size=10,
        )
        result_b64 = base64.b64encode(output_bytes).decode("utf-8")

        return jsonify({"image": result_b64})
    except Exception as e:
        print(f"[rembg] Error: {e}", file=sys.stderr)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 7100
    print(f"[rembg] Starting on port {port}")
    app.run(host="127.0.0.1", port=port, threaded=True)
