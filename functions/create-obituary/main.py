import boto3
import time
import hashlib
import json
import base64
import uuid
import requests
from requests_toolbelt.multipart import decoder

ssm = boto3.client('ssm')
client = boto3.client("polly")

dynamodb_resource = boto3.resource("dynamodb")
table = dynamodb_resource.Table("obituaries-30153574")

# gets api-keys from the aws systems manager
# current: cloudinary and chatgpt :)

def get_parameter(param_name):
    response = ssm.get_parameters(
        Names=[
            param_name,
        ],
        WithDecryption=True
    )
    for parameter in response['Parameters']:
        return parameter['Value']


# for chatgpt, give the basic prompt in main lambda function
# and return the reply as string
def gpt_response(prompt):
    GPT_KEY = get_parameter("gpt-key")
    url = "https://api.openai.com/v1/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GPT_KEY}"
    }
    body = {
        "model": "text-davinci-003",
        "prompt": prompt,
        "max_tokens": 400,
        "temperature": 0.2
    }
    res = requests.post(url, headers=headers, json=body)
    return res.json()["choices"][0]["text"]

## all cloudinary stuff... eww ##
# upload the media file to cloudinary

def upload_cloudinary(filename, resource_type):
    CLOUDINARY_KEY = get_parameter("cloudinary-key")
    api_key = "736582996387254"
    cloud_name = "dgvm2bhcp"
    body = {
        "api_key": api_key
        # dont put resource_type here
        # "resource_type": resource_type
    }

    files = {
        "file": open(filename, "rb")
    }

    body["signature"] = create_signature(body, CLOUDINARY_KEY)
    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/upload"
    res = requests.post(url, files=files, data=body)
    print(res.json())
    return res.json()

# creating a signature

def create_signature(body, secret_key):
    exclude = ["api_key", "resource_type", "cloud_name"]
    timestamp = int(time.time())
    body["timestamp"] = timestamp

    sorted_body = sort_dict(body, exclude)
    query_string = query_string_create(sorted_body)

    query_string_appended = f"{query_string}{secret_key}"
    hashed = hashlib.sha1(query_string_appended.encode())
    return hashed.hexdigest()

# sort dictionary


def sort_dict(dictionary, exclude):
    return {k: v for k, v in sorted(dictionary.items(), key=lambda item: item[0]) if k not in exclude}

# query string generator

def query_string_create(body):
    q_string = ""
    for idx, (k, v) in enumerate(body.items()):
        if idx == 0:
            q_string = f"{k}={v}"
        else:
            q_string = f"{q_string}&{k}={v}"
    return q_string
## end of cloudinary stuff thank god ##

# aws polly, given prompt generated from chatgpt
# pass through it here

def polly_speech(prompt):
    response = client.synthesize_speech(
        Engine='standard',
        LanguageCode='en-US',
        OutputFormat='mp3',
        Text=prompt,
        TextType='text',
        VoiceId="Joanna"
    )

    filename = "/tmp/polly.mp3"
    with open(filename, "wb") as f:
        f.write(response["AudioStream"].read())
    return filename

## main lambda function ##

def create_lambda_handler_30153574(event, context):
    # first you need to get the body of the request
    # body will be in binary format
    # you can't parse it as json w/ json.loads()
    body = event["body"]

    # now you need to decode the body
    # one gotcha is that it could be base64encoded so you need to decode first
    if event["isBase64Encoded"]:
        body = base64.b64decode(body)

    # you need to decode body with decoder.MultipartDecoder
    # ...
    content_type = event["headers"]["content-type"]
    data = decoder.MultipartDecoder(body, content_type)

    binary_data = [part.content for part in data.parts]
    name = binary_data[1].decode()
    birthDate = binary_data[2].decode()
    deathDate = binary_data[3].decode()
    id = binary_data[4].decode()

    key = "/tmp/obituary.png"
    with open(key, "wb") as f:
        f.write(binary_data[0])

    res_img = upload_cloudinary(key, resource_type="image")
    chatgpt_line = gpt_response(
        f"Write a 2-3 sentence funny obituary about a fictional character named {name} who was born on {birthDate} and died on {deathDate}")

    voice_prompt = polly_speech(chatgpt_line)
    res_mp3 = upload_cloudinary(
        voice_prompt, resource_type="raw")

    item = {
        "id": id,
        "name": name,
        "birth": birthDate,
        "death": deathDate,
        "img_resp": res_img["secure_url"],
        "gpt": chatgpt_line,
        "polly_resp": res_mp3["secure_url"],
    }

    try:
        table.put_item(Item=item)
        return {
            "statusCode": 200,
            "body": json.dumps(item)
        }
    except Exception as e:
        print(f"Exception: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "message": str(e)
            })
        }


