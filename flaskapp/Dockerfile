FROM python:2.7
ADD . /code
WORKDIR /code
RUN pip install -r requirements.txt

EXPOSE 5000
CMD (gunicorn --reload -b 0.0.0.0:5000 app:app --log-level=info --log-file=/dev/stdout)
