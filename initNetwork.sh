
composer network install --card PeerAdmin@hlfv1 --archiveFile coffeescm-network_final.bna

composer network start --networkName coffeescm-network --networkVersion 0.0.4-deploy.10 --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card

composer card import -f networkadmin.card -c networkadmin

composer-rest-server -c networkadmin -n never -u true -w true

