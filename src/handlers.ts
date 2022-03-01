import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS, { DynamoDB, MarketplaceEntitlementService, Response } from "aws-sdk";
import * as yup from "yup";
import fetch from "node-fetch";

const docClient = new AWS.DynamoDB.DocumentClient();
const s3Bucket = new AWS.S3();
const tableName = "IPsTable4";
const headers = {
  "content-type": "application/json",
};

const schema = yup.object().shape({
  ipAddress: yup.string().required(),
  name: yup.string().required(),
});

export const makeIP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const reqBody = JSON.parse(event.body as string);

    await schema.validate(reqBody, { abortEarly: false });

    const IPAddr = {
      ...reqBody,
    };

    await docClient
      .put({
        TableName: tableName,
        Item: IPAddr,
      })
      .promise();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(IPAddr),
    };
  } catch (e) {
    return handleError(e);
  }
};

class HttpError extends Error {
  constructor(public statusCode: number, body: Record<string, unknown> = {}) {
    super(JSON.stringify(body));
  }
}

const fetchIPById = async (id: string) => {
  const output = await docClient
    .get({
      TableName: tableName,
      Key: {
        ipAddress: id,
      },
    })
    .promise();

  if (!output.Item) {
    throw new HttpError(404, { error: "not found" });
  }

  return output.Item;
};

const handleError = (e: unknown) => {
  if (e instanceof yup.ValidationError) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        errors: e.errors,
      }),
    };
  }

  if (e instanceof SyntaxError) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `invalid request body format : "${e.message}"` }),
    };
  }

  if (e instanceof HttpError) {
    return {
      statusCode: e.statusCode,
      headers,
      body: e.message,
    };
  }

  throw e;
};

export const getIP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const IPAddr = await fetchIPById(event.pathParameters?.id as string);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(IPAddr),
    };
  } catch (e) {
    return handleError(e);
  }
};

export const updateIP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;

    await fetchIPById(id);

    const reqBody = JSON.parse(event.body as string);

    await schema.validate(reqBody, { abortEarly: false });

    const IPAddr = {
      ...reqBody,
      ipAddress: id,
    };

    await docClient
      .put({
        TableName: tableName,
        Item: IPAddr,
      })
      .promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(IPAddr),
    };
  } catch (e) {
    return handleError(e);
  }
};

export const deleteIP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id as string;

    await fetchIPById(id);

    await docClient
      .delete({
        TableName: tableName,
        Key: {
          ipAddress: id,
        },
      })
      .promise();

    return {
      statusCode: 204,
      body: "",
    };
  } catch (e) {
    return handleError(e);
  }
};

export const listIP = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const output = await docClient
    .scan({
      TableName: tableName
    })
    .promise();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(output.Items),
  };
};

export const truncateDatabase = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const rows = await docClient
    .scan({
      TableName: tableName,
      AttributesToGet: ['ipAddress']
    })
    .promise();

  rows.Items?.forEach(function(ipAddressList){
    docClient.delete({
      TableName: tableName,
      Key: {
        ipAddress: ipAddressList.ipAddress,
      }
    })
    .promise()
  });

  return {
    statusCode: 200,
    headers,
    body: "successfully purged the database",
  };
};

//export const updateDatabase = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
export const updateDatabase = async (id: string) => {
  //await Promise.resolve(1);

  const fileList = [
    "alienvault_reputation.ipset",
    "asprox_c2.ipset",
    "bambenek_banjori.ipset",
    "bambenek_bebloh.ipset",
    "bambenek_c2.ipset",
    "bambenek_cl.ipset",
    "bambenek_cryptowall.ipset",
    "bambenek_dircrypt.ipset",
    "bambenek_dyre.ipset",
    "bambenek_geodo.ipset",
    "bambenek_hesperbot.ipset",
    "bambenek_matsnu.ipset",
    "bambenek_necurs.ipset",
    "bambenek_p2pgoz.ipset",
    "bambenek_pushdo.ipset",
    "bambenek_pykspa.ipset",
    "bambenek_qakbot.ipset",
    "bambenek_ramnit.ipset",
    "bambenek_ranbyus.ipset",
    "bambenek_simda.ipset",
    "bambenek_suppobox.ipset",
    "bambenek_symmi.ipset",
    "bambenek_tinba.ipset",
    "bambenek_volatile.ipset",
    "bds_atif.ipset",
    "bitcoin_blockchain_info_1d.ipset",
    "bitcoin_blockchain_info_30d.ipset",
    "bitcoin_blockchain_info_7d.ipset",
    "bitcoin_nodes.ipset",
    "bitcoin_nodes_1d.ipset",
    "bitcoin_nodes_30d.ipset",
    "bitcoin_nodes_7d.ipset",
    "blocklist_de.ipset",
    "blocklist_de_apache.ipset",
    "blocklist_de_bots.ipset",
    "blocklist_de_bruteforce.ipset",
    "blocklist_de_ftp.ipset",
    "blocklist_de_imap.ipset",
    "blocklist_de_mail.ipset",
    "blocklist_de_sip.ipset",
    "blocklist_de_ssh.ipset",
    "blocklist_de_strongips.ipset",
    "blocklist_net_ua.ipset",
    "botscout.ipset",
    "botscout_1d.ipset",
    "botscout_30d.ipset",
    "botscout_7d.ipset",
    "botvrij_dst.ipset",
    "botvrij_src.ipset",
    "bruteforceblocker.ipset",
    "ciarmy.ipset",
    "cleanmx_phishing.ipset",
    "cleanmx_viruses.ipset",
    "cleantalk.ipset",
    "cleantalk_1d.ipset",
    "cleantalk_30d.ipset",
    "cleantalk_7d.ipset",
    "cleantalk_new.ipset",
    "cleantalk_new_1d.ipset",
    "cleantalk_new_30d.ipset",
    "cleantalk_new_7d.ipset",
    "cleantalk_top20.ipset",
    "cleantalk_updated.ipset",
    "cleantalk_updated_1d.ipset",
    "cleantalk_updated_30d.ipset",
    "cleantalk_updated_7d.ipset",
    "coinbl_hosts.ipset",
    "coinbl_hosts_browser.ipset",
    "coinbl_hosts_optional.ipset",
    "coinbl_ips.ipset",
    "cruzit_web_attacks.ipset",
    "cta_cryptowall.ipset",
    "cybercrime.ipset",
    "dm_tor.ipset",
    "dshield_top_1000.ipset",
    "dyndns_ponmocup.ipset",
    "esentire_14072015_com.ipset",
    "esentire_14072015q_com.ipset",
    "esentire_22072014a_com.ipset",
    "esentire_22072014b_com.ipset",
    "esentire_22072014c_com.ipset",
    "esentire_atomictrivia_ru.ipset",
    "esentire_auth_update_ru.ipset",
    "esentire_burmundisoul_ru.ipset",
    "esentire_crazyerror_su.ipset",
    "esentire_dagestanskiiviskis_ru.ipset",
    "esentire_differentia_ru.ipset",
    "esentire_disorderstatus_ru.ipset",
    "esentire_dorttlokolrt_com.ipset",
    "esentire_downs1_ru.ipset",
    "esentire_ebankoalalusys_ru.ipset",
    "esentire_emptyarray_ru.ipset",
    "esentire_fioartd_com.ipset",
    "esentire_getarohirodrons_com.ipset",
    "esentire_hasanhashsde_ru.ipset",
    "esentire_inleet_ru.ipset",
    "esentire_islamislamdi_ru.ipset",
    "esentire_krnqlwlplttc_com.ipset",
    "esentire_maddox1_ru.ipset",
    "esentire_manning1_ru.ipset",
    "esentire_misteryherson_ru.ipset",
    "esentire_mysebstarion_ru.ipset",
    "esentire_smartfoodsglutenfree_kz.ipset",
    "esentire_venerologvasan93_ru.ipset",
    "esentire_volaya_ru.ipset",
    "et_botcc.ipset",
    "et_compromised.ipset",
    "et_tor.ipset",
    "feodo.ipset",
    "feodo_badips.ipset",
    "gpf_comics.ipset",
    "greensnow.ipset",
    "haley_ssh.ipset",
    "hphosts_ats.ipset",
    "hphosts_emd.ipset",
    "hphosts_exp.ipset",
    "hphosts_fsa.ipset",
    "hphosts_grm.ipset",
    "hphosts_hfs.ipset",
    "hphosts_hjk.ipset",
    "hphosts_mmt.ipset",
    "hphosts_pha.ipset",
    "hphosts_psh.ipset",
    "hphosts_wrz.ipset",
    "ipblacklistcloud_recent.ipset",
    "ipblacklistcloud_recent_1d.ipset",
    "ipblacklistcloud_recent_30d.ipset",
    "ipblacklistcloud_recent_7d.ipset",
    "ipblacklistcloud_top.ipset",
    "iw_spamlist.ipset",
    "iw_wormlist.ipset",
    "lashback_ubl.ipset",
    "malc0de.ipset",
    "malwaredomainlist.ipset",
    "maxmind_proxy_fraud.ipset",
    "myip.ipset",
    "nixspam.ipset",
    "normshield_all_attack.ipset",
    "normshield_all_bruteforce.ipset",
    "normshield_all_ddosbot.ipset",
    "normshield_all_dnsscan.ipset",
    "normshield_all_spam.ipset",
    "normshield_all_suspicious.ipset",
    "normshield_all_wannacry.ipset",
    "normshield_all_webscan.ipset",
    "normshield_all_wormscan.ipset",
    "normshield_high_attack.ipset",
    "normshield_high_bruteforce.ipset",
    "normshield_high_ddosbot.ipset",
    "normshield_high_dnsscan.ipset",
    "normshield_high_spam.ipset",
    "normshield_high_suspicious.ipset",
    "normshield_high_wannacry.ipset",
    "normshield_high_webscan.ipset",
    "normshield_high_wormscan.ipset",
    "nt_malware_dns.ipset",
    "nt_malware_http.ipset",
    "nt_malware_irc.ipset",
    "nt_ssh_7d.ipset",
    "nullsecure.ipset",
    "packetmail.ipset",
    "packetmail_emerging_ips.ipset",
    "packetmail_mail.ipset",
    "packetmail_ramnode.ipset",
    "php_commenters.ipset",
    "php_commenters_1d.ipset",
    "php_commenters_30d.ipset",
    "php_commenters_7d.ipset",
    "php_dictionary.ipset",
    "php_dictionary_1d.ipset",
    "php_dictionary_30d.ipset",
    "php_dictionary_7d.ipset",
    "php_harvesters.ipset",
    "php_harvesters_1d.ipset",
    "php_harvesters_30d.ipset",
    "php_harvesters_7d.ipset",
    "php_spammers.ipset",
    "php_spammers_1d.ipset",
    "php_spammers_30d.ipset",
    "php_spammers_7d.ipset",
    "proxylists.ipset",
    "proxylists_1d.ipset",
    "proxylists_30d.ipset",
    "proxylists_7d.ipset",
    "proxyspy_1d.ipset",
    "proxyspy_30d.ipset",
    "proxyspy_7d.ipset",
    "proxz.ipset",
    "proxz_1d.ipset",
    "proxz_30d.ipset",
    "proxz_7d.ipset",
    "ransomware_cryptowall_ps.ipset",
    "ransomware_feed.ipset",
    "ransomware_locky_c2.ipset",
    "ransomware_locky_ps.ipset",
    "ransomware_online.ipset",
    "ransomware_rw.ipset",
    "ransomware_teslacrypt_ps.ipset",
    "ransomware_torrentlocker_c2.ipset",
    "ransomware_torrentlocker_ps.ipset",
    "sblam.ipset",
    "snort_ipfilter.ipset",
    "socks_proxy.ipset",
    "socks_proxy_1d.ipset",
    "socks_proxy_30d.ipset",
    "socks_proxy_7d.ipset",
    "sslbl.ipset",
    "sslbl_aggressive.ipset",
    "sslproxies.ipset",
    "sslproxies_1d.ipset",
    "sslproxies_30d.ipset",
    "sslproxies_7d.ipset",
    "stopforumspam.ipset",
    "stopforumspam_180d.ipset",
    "stopforumspam_1d.ipset",
    "stopforumspam_30d.ipset",
    "stopforumspam_365d.ipset",
    "stopforumspam_7d.ipset",
    "stopforumspam_90d.ipset",
    "taichung.ipset",
    "talosintel_ipfilter.ipset",
    "threatcrowd.ipset",
    "tor_exits.ipset",
    "tor_exits_1d.ipset",
    "tor_exits_30d.ipset",
    "tor_exits_7d.ipset",
    "turris_greylist.ipset",
    "urandomusto_dns.ipset",
    "urandomusto_ftp.ipset",
    "urandomusto_http.ipset",
    "urandomusto_mailer.ipset",
    "urandomusto_malware.ipset",
    "urandomusto_ntp.ipset",
    "urandomusto_rdp.ipset",
    "urandomusto_smb.ipset",
    "urandomusto_spam.ipset",
    "urandomusto_ssh.ipset",
    "urandomusto_telnet.ipset",
    "urandomusto_unspecified.ipset",
    "urandomusto_vnc.ipset",
    "urlvir.ipset",
    "uscert_hidden_cobra.ipset",
    "vxvault.ipset",
    "xforce_bccs.ipset",
    "xroxy.ipset",
    "xroxy_1d.ipset",
    "xroxy_30d.ipset",
    "xroxy_7d.ipset",
    "yoyo_adservers.ipset"
  ];
  
  fileList.forEach(
    function(name){
      if(name != null){
        const filename = name.toString();
        const fileUrl = "https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/";
        
        const getFile = fileUrl + filename;

        console.log(filename);

        
        fetch(getFile)
          .then(response => response.text())
          .then(data => {
            data.toString().split(/\r?\n/).forEach(
            function (line) {
                if (
                  (
                    line.toString().charAt(1) == "1" ||
                    line.toString().charAt(1) == "2" ||
                    line.toString().charAt(1) == "3" ||
                    line.toString().charAt(1) == "4" ||
                    line.toString().charAt(1) == "5" ||
                    line.toString().charAt(1) == "6" ||
                    line.toString().charAt(1) == "7" ||
                    line.toString().charAt(1) == "8" ||
                    line.toString().charAt(1) == "9" ||
                    line.toString().charAt(1) == "0" ||
                    line.toString().charAt(1) == "." 
                  )
                ){
                    const IPAddr = {
                      ipAddress: line.toString(),
                      name: filename
                    };
                    docClient
                    .put({
                      TableName: tableName,
                      Item: IPAddr,
                    })
                    //.promise();
                        
                }
              }
            )
          }
        );
      }
    }
  )
  return {
    statusCode: 200,
    headers,
    body: "Successfully Updated Database"
    
  };
};

export const cronjob = async (id: string) => {
  truncateDatabase;
  updateDatabase;

  return {
    statusCode: 200,
    headers,
    body: "Successfully Updated Database"

  };
};