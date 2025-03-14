import datetime, json
import urllib.request
from flask_apscheduler import APScheduler
from common.file import JsonData

aps = APScheduler()

@aps.task("interval", id="job", seconds=60)
def server_task():
    print(datetime.datetime.now())

# @aps.task("interval", id="stable_diffusion_api", seconds=60)
# def post_stable_diffusion():
#     data = JsonData("stable_diffusion.json").data
#     url = 'http://127.0.0.1:7860/sdapi/v1/txt2img'
#     headers = {
#         'Content-Type': 'application/json',
#     }
#     req = urllib.request.Request(url, json.dumps(data).encode(), headers)
#     with urllib.request.urlopen(req) as res:
#         body = res.read()

#     print(body)
#     response = json.loads(body)
#     image = Image.open(io.BytesIO(base64.b64decode(i.split(",",1)[0])))

"""
{
  "prompt": "",
  "negative_prompt": "",
  "styles": [
    "string"
  ],
  "seed": -1,
  "subseed": -1,
  "subseed_strength": 0,
  "seed_resize_from_h": -1,
  "seed_resize_from_w": -1,
  "sampler_name": "string",
  "scheduler": "string",
  "batch_size": 1,
  "n_iter": 1,
  "steps": 50,
  "cfg_scale": 7,
  "width": 512,
  "height": 512,
  "restore_faces": true,
  "tiling": true,
  "do_not_save_samples": false,
  "do_not_save_grid": false,
  "eta": 0,
  "denoising_strength": 0,
  "s_min_uncond": 0,
  "s_churn": 0,
  "s_tmax": 0,
  "s_tmin": 0,
  "s_noise": 0,
  "override_settings": {},
  "override_settings_restore_afterwards": true,
  "refiner_checkpoint": "string",
  "refiner_switch_at": 0,
  "disable_extra_networks": false,
  "firstpass_image": "string",
  "comments": {},
  "enable_hr": false,
  "firstphase_width": 0,
  "firstphase_height": 0,
  "hr_scale": 2,
  "hr_upscaler": "string",
  "hr_second_pass_steps": 0,
  "hr_resize_x": 0,
  "hr_resize_y": 0,
  "hr_checkpoint_name": "string",
  "hr_sampler_name": "string",
  "hr_scheduler": "string",
  "hr_prompt": "",
  "hr_negative_prompt": "",
  "force_task_id": "string",
  "sampler_index": "Euler",
  "script_name": "string",
  "script_args": [],
  "send_images": true,
  "save_images": false,
  "alwayson_scripts": {},
  "infotext": "string"
}
"""