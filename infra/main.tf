terraform {
  required_providers {
    aws = {
      version = ">= 4.0.0"
      source  = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = "ca-central-1"
  access_key = "AKIATRXGNSK2JGU2JWZP"
  secret_key = "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"

}

## LAMBDA FUNCTIONS ##
# using a locals block to declare constants for get obituaries
locals {
  function_name                = "get-obituaries-30153574"
  get_obituaries_handler_name  = "main.get_lambda_handler_30153574"
  get_obituaries_artifact_name = "get-obituaries-artifact.zip"
}

# using a locals block to declare constants for create obituary 
locals {
  function_name1                = "create-obituary-30153574"
  create_obituary_handler_name  = "main.create_lambda_handler_30153574"
  create_obituary_artifact_name = "create-obituary-artifact.zip"
}

# create a role for the get-obituaries Lambda function to assume
resource "aws_iam_role" "get_obituaries_lambda" {
  name               = "iam-for-lambda-${local.function_name}"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

# create a role for the create-obituary Lambda function to assume
resource "aws_iam_role" "create_obituary_lambda" {
  name               = "iam-for-lambda-${local.function_name1}"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

# create archive file from main.py for get-obituaries
data "archive_file" "get_obituaries_lambda" {
  type        = "zip"
  source_file = "../functions/get-obituaries/main.py"
  output_path = "get-obituaries-artifact.zip"

}

# create archive file from main.py for create-obituary
data "archive_file" "create_obituary_lambda" {
  type        = "zip"
  source_dir  = "../functions/create-obituary"
  output_path = "create-obituary-artifact.zip"

}

# create a Lambda function get-obituaries
resource "aws_lambda_function" "get_obituaries_lambda" {
  role             = aws_iam_role.get_obituaries_lambda.arn
  function_name    = local.function_name
  handler          = local.get_obituaries_handler_name
  filename         = local.get_obituaries_artifact_name
  source_code_hash = data.archive_file.get_obituaries_lambda.output_base64sha256
  runtime          = "python3.9"
}

# create a Lambda function create-obituary
resource "aws_lambda_function" "create_obituary_lambda" {
  role             = aws_iam_role.create_obituary_lambda.arn
  function_name    = local.function_name1
  handler          = local.create_obituary_handler_name
  filename         = local.create_obituary_artifact_name
  source_code_hash = data.archive_file.create_obituary_lambda.output_base64sha256
  runtime          = "python3.9"
  timeout          = 20
}

# create a policy for publishing logs to CloudWatch for get-obituaries
resource "aws_iam_policy" "logs_get" {
  name        = "lambda-logging-${local.function_name}"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "dynamodb:Scan",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
        "polly:SynthesizeSpeech"
      ],
      "Resource": ["arn:aws:logs:*:*:*", "${aws_dynamodb_table.obituaries.arn}", "*", "*"], 
      "Effect": "Allow"
    }
  ]
}
EOF
}

# create a policy for publishing logs to CloudWatch for create-obituaries
resource "aws_iam_policy" "logs_create" {
  name        = "lambda-logging-${local.function_name1}"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "dynamodb:PutItem",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
        "polly:SynthesizeSpeech"
      ],
      "Resource": ["arn:aws:logs:*:*:*", "${aws_dynamodb_table.obituaries.arn}", "*", "*"], 
      "Effect": "Allow"
    }
  ]
}
EOF
}

# attach above policy to function role 
resource "aws_iam_role_policy_attachment" "lambda_logs_get" {
  role       = aws_iam_role.get_obituaries_lambda.name
  policy_arn = aws_iam_policy.logs_get.arn
}

# attach above policy to function role 
resource "aws_iam_role_policy_attachment" "lambda_logs_create" {
  role       = aws_iam_role.create_obituary_lambda.name
  policy_arn = aws_iam_policy.logs_create.arn
}

# create a Function URL for Lambda 
resource "aws_lambda_function_url" "url_get" {
  function_name      = aws_lambda_function.get_obituaries_lambda.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

# create a Function URL for Lambda 
resource "aws_lambda_function_url" "url_create" {
  function_name      = aws_lambda_function.create_obituary_lambda.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

# show the Function URL for get-obituaries after creation
output "get_obituaries_lambda_url" {
  value = aws_lambda_function_url.url_get.function_url
}

# show the Function URL for create-obituary after creation
output "create_obituary_lambda_url" {
  value = aws_lambda_function_url.url_create.function_url
}

## DYNAMODB TABLE ##
# read the docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/dynamodb_table
resource "aws_dynamodb_table" "obituaries" {
  name         = "obituaries-30153574"
  billing_mode = "PROVISIONED"

  # up to 8KB read per second (eventually consistent)
  read_capacity = 1

  # up to 1KB per second
  write_capacity = 1

  # we only need a student id to find an item in the table; therefore, we 
  # don't need a sort key here
  hash_key = "id"
  # the hash_key data type is string
  attribute {
    name = "id"
    type = "S"
  }
}

