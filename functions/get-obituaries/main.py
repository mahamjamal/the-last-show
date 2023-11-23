import boto3
import json

dynamodb_resource = boto3.resource("dynamodb")
table = dynamodb_resource.Table("obituaries-30153574")


def get_lambda_handler_30153574(event, context):
    try:
        response = table.scan()
    except Exception as exp:
        print(exp)
        return {
            "statusCode": 500,
            "body": str(exp)
        }

    items = response['Items']

    return {
        "statusCode": 200,

        "body": json.dumps(items)

    }
