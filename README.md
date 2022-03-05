# FantasyOscars

This Node.js Express server was built in half of a week to allow my friends and I to compare and score our Oscar Predictions.

Due to the time limitation of this project's development, a number of best practices were avoided (eg the generation of an HTML table with String manipulation rather than a templater such as Jade), but I still decided to password protect individual responses to keep my friends from changing my answers.


zip -r ~/Downloads/FantasyOscars.zip ./
scp -i gwssh.pem FantasyOscars.zip ec2-user@ec2-34-212-93-49.us-west-2.compute.amazonaws.com:~/


ssh -i "gwssh.pem" ec2-user@ec2-34-212-93-49.us-west-2.compute.amazonaws.com
make sure nginx is running: sudo service nginx restart ?
unzip -o FantasyOscars.zip && sudo kill $(pgrep node) && nohup node index.js &

