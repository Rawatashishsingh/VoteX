const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'votex.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) { console.error('Error opening database', err.message); }
  else {
    console.log('Connected to the SQLite database.');
    db.run('PRAGMA foreign_keys = ON');
  }
});

const ALL_STATES = [
  { state: 'Andhra Pradesh', districts: ['Anantapur','Chittoor','East Godavari','Guntur','Krishna','Kurnool','Nellore','Prakasam','Srikakulam','Visakhapatnam','Vizianagaram','West Godavari','YSR Kadapa'] },
  { state: 'Arunachal Pradesh', districts: ['Anjaw','Changlang','Dibang Valley','East Kameng','East Siang','Kamle','Kra Daadi','Kurung Kumey','Lepa Rada','Lohit','Longding','Lower Dibang Valley','Lower Siang','Lower Subansiri','Namsai','Pakke-Kessang','Papum Pare','Shi Yomi','Siang','Tawang','Tirap','Upper Dibang Valley','Upper Siang','Upper Subansiri','West Kameng','West Siang'] },
  { state: 'Assam', districts: ['Baksa','Barpeta','Biswanath','Bongaigaon','Cachar','Charaideo','Chirang','Darrang','Dhemaji','Dhubri','Dibrugarh','Dima Hasao','Goalpara','Golaghat','Hailakandi','Hojai','Jorhat','Kamrup','Kamrup Metropolitan','Karbi Anglong','Karimganj','Kokrajhar','Lakhimpur','Majuli','Morigaon','Nagaon','Nalbari','Sivasagar','Sonitpur','South Salmara-Mankachar','Tinsukia','Udalguri','West Karbi Anglong'] },
  { state: 'Bihar', districts: ['Araria','Arwal','Aurangabad','Banka','Begusarai','Bhagalpur','Bhojpur','Buxar','Darbhanga','East Champaran','Gaya','Gopalganj','Jamui','Jehanabad','Kaimur','Katihar','Khagaria','Kishanganj','Lakhisarai','Madhepura','Madhubani','Munger','Muzaffarpur','Nalanda','Nawada','Patna','Purnia','Rohtas','Saharsa','Samastipur','Saran','Sheikhpura','Sheohar','Sitamarhi','Siwan','Supaul','Vaishali','West Champaran'] },
  { state: 'Chhattisgarh', districts: ['Balod','Baloda Bazar','Balrampur','Bastar','Bemetara','Bijapur','Bilaspur','Dantewada','Dhamtari','Durg','Gariyaband','Gaurela-Pendra-Marwahi','Janjgir-Champa','Jashpur','Kabirdham','Kanker','Kondagaon','Korba','Koriya','Mahasamund','Mungeli','Narayanpur','Raigarh','Raipur','Rajnandgaon','Sukma','Surajpur','Surguja'] },
  { state: 'Goa', districts: ['North Goa','South Goa'] },
  { state: 'Gujarat', districts: ['Ahmedabad','Amreli','Anand','Aravalli','Banaskantha','Bharuch','Bhavnagar','Botad','Chhota Udaipur','Dahod','Dang','Devbhoomi Dwarka','Gandhinagar','Gir Somnath','Jamnagar','Junagadh','Kheda','Kutch','Mahisagar','Mehsana','Morbi','Narmada','Navsari','Panchmahal','Patan','Porbandar','Rajkot','Sabarkantha','Surat','Surendranagar','Tapi','Vadodara','Valsad'] },
  { state: 'Haryana', districts: ['Ambala','Bhiwani','Charkhi Dadri','Faridabad','Fatehabad','Gurugram','Hisar','Jhajjar','Jind','Kaithal','Karnal','Kurukshetra','Mahendragarh','Nuh','Palwal','Panchkula','Panipat','Rewari','Rohtak','Sirsa','Sonipat','Yamunanagar'] },
  { state: 'Himachal Pradesh', districts: ['Bilaspur','Chamba','Hamirpur','Kangra','Kinnaur','Kullu','Lahaul and Spiti','Mandi','Shimla','Sirmaur','Solan','Una'] },
  { state: 'Jharkhand', districts: ['Bokaro','Chatra','Deoghar','Dhanbad','Dumka','East Singhbhum','Garhwa','Giridih','Godda','Gumla','Hazaribagh','Jamtara','Khunti','Koderma','Latehar','Lohardaga','Pakur','Palamu','Ramgarh','Ranchi','Sahebganj','Seraikela-Kharsawan','Simdega','West Singhbhum'] },
  { state: 'Karnataka', districts: ['Bagalkot','Ballari','Belagavi','Bengaluru Rural','Bengaluru Urban','Bidar','Chamarajanagar','Chikkaballapur','Chikkamagaluru','Chitradurga','Dakshina Kannada','Davanagere','Dharwad','Gadag','Hassan','Haveri','Kalaburagi','Kodagu','Kolar','Koppal','Mandya','Mysuru','Raichur','Ramanagara','Shivamogga','Tumakuru','Udupi','Uttara Kannada','Vijayapura','Yadgir'] },
  { state: 'Kerala', districts: ['Alappuzha','Ernakulam','Idukki','Kannur','Kasaragod','Kollam','Kottayam','Kozhikode','Malappuram','Palakkad','Pathanamthitta','Thiruvananthapuram','Thrissur','Wayanad'] },
  { state: 'Madhya Pradesh', districts: ['Agar Malwa','Alirajpur','Anuppur','Ashoknagar','Balaghat','Barwani','Betul','Bhind','Bhopal','Burhanpur','Chhatarpur','Chhindwara','Damoh','Datia','Dewas','Dhar','Dindori','Guna','Gwalior','Harda','Hoshangabad','Indore','Jabalpur','Jhabua','Katni','Khandwa','Khargone','Mandla','Mandsaur','Morena','Narsinghpur','Neemuch','Niwari','Panna','Raisen','Rajgarh','Ratlam','Rewa','Sagar','Satna','Sehore','Seoni','Shahdol','Shajapur','Sheopur','Shivpuri','Sidhi','Singrauli','Tikamgarh','Ujjain','Umaria','Vidisha'] },
  { state: 'Maharashtra', districts: ['Ahmednagar','Akola','Amravati','Aurangabad','Beed','Bhandara','Buldhana','Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli','Jalgaon','Jalna','Kolhapur','Latur','Mumbai City','Mumbai Suburban','Nagpur','Nanded','Nandurbar','Nashik','Osmanabad','Palghar','Parbhani','Pune','Raigad','Ratnagiri','Sangli','Satara','Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal'] },
  { state: 'Manipur', districts: ['Bishnupur','Chandel','Churachandpur','Imphal East','Imphal West','Jiribam','Kakching','Kamjong','Kangpokpi','Noney','Pherzawl','Senapati','Tamenglong','Tengnoupal','Thoubal','Ukhrul'] },
  { state: 'Meghalaya', districts: ['East Garo Hills','East Jaintia Hills','East Khasi Hills','Eastern West Khasi Hills','North Garo Hills','Ri Bhoi','South Garo Hills','South West Garo Hills','South West Khasi Hills','West Garo Hills','West Jaintia Hills','West Khasi Hills'] },
  { state: 'Mizoram', districts: ['Aizawl','Champhai','Hnahthial','Khawzawl','Kolasib','Lawngtlai','Lunglei','Mamit','Saiha','Saitual','Serchhip'] },
  { state: 'Nagaland', districts: ['Chumoukedima','Dimapur','Kiphire','Kohima','Longleng','Mokokchung','Mon','Niuland','Noklak','Peren','Phek','Shamator','Tseminyu','Tuensang','Wokha','Zunheboto'] },
  { state: 'Odisha', districts: ['Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh','Cuttack','Deogarh','Dhenkanal','Gajapati','Ganjam','Jagatsinghpur','Jajpur','Jharsuguda','Kalahandi','Kandhamal','Kendrapara','Kendujhar','Khordha','Koraput','Malkangiri','Mayurbhanj','Nabarangpur','Nayagarh','Nuapada','Puri','Rayagada','Sambalpur','Sonepur','Sundargarh'] },
  { state: 'Punjab', districts: ['Amritsar','Barnala','Bathinda','Faridkot','Fatehgarh Sahib','Fazilka','Ferozepur','Gurdaspur','Hoshiarpur','Jalandhar','Kapurthala','Ludhiana','Mansa','Moga','Mohali','Muktsar','Pathankot','Patiala','Rupnagar','Sangrur','Shaheed Bhagat Singh Nagar','Tarn Taran'] },
  { state: 'Rajasthan', districts: ['Ajmer','Alwar','Banswara','Baran','Barmer','Bharatpur','Bhilwara','Bikaner','Bundi','Chittorgarh','Churu','Dausa','Dholpur','Dungarpur','Hanumangarh','Jaipur','Jaisalmer','Jalore','Jhalawar','Jhunjhunu','Jodhpur','Karauli','Kota','Nagaur','Pali','Pratapgarh','Rajsamand','Sawai Madhopur','Sikar','Sirohi','Sri Ganganagar','Tonk','Udaipur'] },
  { state: 'Sikkim', districts: ['East Sikkim','North Sikkim','Pakyong','Soreng','South Sikkim','West Sikkim'] },
  { state: 'Tamil Nadu', districts: ['Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul','Erode','Kallakurichi','Kancheepuram','Kanyakumari','Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore','Villupuram','Virudhunagar'] },
  { state: 'Telangana', districts: ['Adilabad','Bhadradri Kothagudem','Hanumakonda','Hyderabad','Jagtial','Jangaon','Jayashankar Bhupalpally','Jogulamba Gadwal','Kamareddy','Karimnagar','Khammam','Kumuram Bheem','Mahabubabad','Mahabubnagar','Mancherial','Medak','Medchal-Malkajgiri','Mulugu','Nagarkurnool','Nalgonda','Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla','Rangareddy','Sangareddy','Siddipet','Suryapet','Vikarabad','Wanaparthy','Warangal','Yadadri Bhuvanagiri'] },
  { state: 'Tripura', districts: ['Dhalai','Gomati','Khowai','North Tripura','Sepahijala','South Tripura','Unakoti','West Tripura'] },
  { state: 'Uttar Pradesh', districts: ['Agra','Aligarh','Ambedkar Nagar','Amethi','Amroha','Auraiya','Ayodhya','Azamgarh','Baghpat','Bahraich','Ballia','Balrampur','Banda','Barabanki','Bareilly','Basti','Bhadohi','Bijnor','Budaun','Bulandshahr','Chandauli','Chitrakoot','Deoria','Etah','Etawah','Farrukhabad','Fatehpur','Firozabad','Gautam Buddha Nagar','Ghaziabad','Ghazipur','Gonda','Gorakhpur','Hamirpur','Hapur','Hardoi','Hathras','Jalaun','Jaunpur','Jhansi','Kannauj','Kanpur Dehat','Kanpur Nagar','Kasganj','Kaushambi','Kheri','Kushinagar','Lalitpur','Lucknow','Maharajganj','Mahoba','Mainpuri','Mathura','Mau','Meerut','Mirzapur','Moradabad','Muzaffarnagar','Pilibhit','Pratapgarh','Prayagraj','Raebareli','Rampur','Saharanpur','Sambhal','Sant Kabir Nagar','Shahjahanpur','Shamli','Shrawasti','Siddharthnagar','Sitapur','Sonbhadra','Sultanpur','Unnao','Varanasi'] },
  { state: 'Uttarakhand', districts: ['Almora','Bageshwar','Chamoli','Champawat','Dehradun','Haridwar','Nainital','Pauri Garhwal','Pithoragarh','Rudraprayag','Tehri Garhwal','Udham Singh Nagar','Uttarkashi'] },
  { state: 'West Bengal', districts: ['Alipurduar','Bankura','Birbhum','Cooch Behar','Dakshin Dinajpur','Darjeeling','Hooghly','Howrah','Jalpaiguri','Jhargram','Kalimpong','Kolkata','Malda','Murshidabad','Nadia','North 24 Parganas','Paschim Bardhaman','Paschim Medinipur','Purba Bardhaman','Purba Medinipur','Purulia','South 24 Parganas','Uttar Dinajpur'] },
  { state: 'Delhi', districts: ['Central Delhi','East Delhi','New Delhi','North Delhi','North East Delhi','North West Delhi','Shahdara','South Delhi','South East Delhi','South West Delhi','West Delhi'] },
  { state: 'Jammu and Kashmir', districts: ['Anantnag','Bandipora','Baramulla','Budgam','Doda','Ganderbal','Jammu','Kathua','Kishtwar','Kulgam','Kupwara','Poonch','Pulwama','Rajouri','Ramban','Reasi','Samba','Shopian','Srinagar','Udhampur'] },
  { state: 'Ladakh', districts: ['Kargil','Leh'] },
  { state: 'Puducherry', districts: ['Karaikal','Mahe','Puducherry','Yanam'] },
  { state: 'Chandigarh', districts: ['Chandigarh'] },
  { state: 'Andaman and Nicobar Islands', districts: ['Nicobar','North and Middle Andaman','South Andaman'] },
  { state: 'Dadra and Nagar Haveli and Daman and Diu', districts: ['Dadra and Nagar Haveli','Daman','Diu'] },
  { state: 'Lakshadweep', districts: ['Lakshadweep'] },
];

const ALL_PARTIES = [
  { name: 'Bharatiya Janata Party', acronym: 'BJP', manifesto: 'Hindutva, national security, economic development, infrastructure, Make in India, Atmanirbhar Bharat.', past_work: 'Article 370 abrogation, Ram Mandir, Jan Dhan Yojana, Swachh Bharat, PM Awas Yojana, GST implementation, surgical strikes.', controversies: 'Demonetisation hardships, Electoral Bonds opacity, Manipur violence delayed response, Pegasus spyware allegations, Farmers protest 2020-21.' },
  { name: 'Indian National Congress', acronym: 'INC', manifesto: 'Secularism, social justice, NYAY scheme, MSP guarantee, right to healthcare, minority rights, federalism.', past_work: 'MGNREGA, RTI Act, Food Security Act, Aadhaar, economic liberalisation 1991, nuclear tests 1974, Green Revolution support.', controversies: '2G Scam ₹1.76L Cr, Commonwealth Games Scam, Coalgate Scam, Bofors Scam, 1984 anti-Sikh riots, Emergency 1975-77.' },
  { name: 'Aam Aadmi Party', acronym: 'AAP', manifesto: 'Free electricity, world-class govt schools, Mohalla clinics, anti-corruption, honest governance, free water.', past_work: 'Delhi education transformation, 200 units free electricity, Mohalla clinics, free bus rides for women, Punjab governance reforms.', controversies: 'Delhi liquor policy scam, Kejriwal arrest 2024, Satyendar Jain money laundering, classroom construction irregularities.' },
  { name: 'Samajwadi Party', acronym: 'SP', manifesto: 'Socialism, OBC/minority upliftment, free laptops, expressway development, law and order focus in UP.', past_work: 'Agra-Lucknow Expressway, laptop distribution scheme, UP power reforms, Lucknow Metro initiation.', controversies: 'Muzaffarnagar riots 2013, law & order issues during tenure, dynastic politics criticism.' },
  { name: 'Bahujan Samaj Party', acronym: 'BSP', manifesto: 'Dalit upliftment, social justice, Ambedkarite ideology, reservation protection, land rights for poor.', past_work: 'Mayawati-era memorials and parks, Dalit empowerment schemes in UP, Noida-Greater Noida development.', controversies: 'Taj Corridor scam, disproportionate assets case against Mayawati, party decline post 2012.' },
  { name: 'Trinamool Congress', acronym: 'TMC', manifesto: 'Bengal-centric development, Duare Sarkar, Lakshmir Bhandar scheme, minority welfare, anti-BJP federalism.', past_work: 'Duare Sarkar camp system, Swasthya Sathi health scheme, Kanyashree programme, cyclone Amphan relief.', controversies: 'Narada sting operation, Saradha chit fund scam, Syndicate raj allegations, post-election violence 2021.' },
  { name: 'Dravida Munnetra Kazhagam', acronym: 'DMK', manifesto: 'Tamil rights, Dravidian ideology, freebies model, federalism, Hindi imposition opposition, welfare schemes.', past_work: '7.5% reservation for govt school students in TN medical seats, free TV/mixie schemes, Kalaignar insurance.', controversies: '2G Scam linkage (A. Raja), family nepotism allegations, Sterlite protest handling.' },
  { name: 'All India Anna Dravida Munnetra Kazhagam', acronym: 'AIADMK', manifesto: 'Amma legacy, Tamil welfare, freebies, farmers welfare, TASMAC reform, law and order.', past_work: 'Amma canteen, green houses scheme, Dr Kalaignar Insurance scheme, rural roads development.', controversies: 'Jayalalithaa disproportionate assets case, O Panneerselvam-Palaniswami split, Sasikala corruption scandal.' },
  { name: 'Janata Dal (United)', acronym: 'JDU', manifesto: 'Bihar development, caste census, prohibition, women empowerment, Nitish Kumar governance model.', past_work: 'Bihar road development, Saat Nischay Yojana, liquor prohibition policy, Jal-Jeevan-Hariyali.', controversies: 'Shelter home scandal Muzaffarpur, repeated alliance switching, power crisis in Bihar.' },
  { name: 'Rashtriya Janata Dal', acronym: 'RJD', manifesto: 'Social justice, OBC/Muslim rights, land reform, MNREGA expansion, caste census demand.', past_work: 'Lalu era railway reforms (Railway University, passenger amenities), social justice politics.', controversies: 'Fodder scam ₹950 Cr (Lalu Prasad convicted), jungle raj allegations, law & order collapse 1990s Bihar.' },
  { name: 'Shiv Sena (UBT)', acronym: 'SSUBT', manifesto: 'Marathi manoos, Maharashtra development, Hindutva with social welfare, Mumbai infrastructure.', past_work: 'Mumbai development during BMC control, Balasaheb Thackeray legacy, Aaditya Thackeray environment work.', controversies: 'Party split 2022 (Shinde faction), extortion allegations in Mumbai, Sushant Singh Rajput controversy.' },
  { name: 'Shiv Sena (Shinde)', acronym: 'SSMHS', manifesto: 'Hindutva, Maharashtra development, alliance with BJP, farmers welfare, Ladki Bahin Yojana.', past_work: 'Ladki Bahin Yojana ₹1500/month, Mukhyamantri Annapurna Yojana, MahaYuti welfare schemes.', controversies: 'Government formation via defection (constitutionality debated), Speaker election controversy.' },
  { name: 'Nationalist Congress Party (SP)', acronym: 'NCPSP', manifesto: 'Secular nationalism, Maharashtra co-operative sector, farmer welfare, anti-corruption, MVA alliance.', past_work: 'Sugar co-operative development, Sharad Pawar agricultural reforms, cricket administration.', controversies: 'NCP split 2023 (Ajit Pawar faction), irrigation scam ₹70,000 Cr, Ajit Pawar disproportionate assets.' },
  { name: 'Communist Party of India (Marxist)', acronym: 'CPM', manifesto: 'Left ideology, worker/farmer rights, land reform, secularism, anti-imperialism, public sector protection.', past_work: 'Kerala model of development, land reforms 1957, literacy mission, public distribution system.', controversies: 'Nandigram violence 2007 (WB), Singur land acquisition, political violence in Kerala and WB.' },
  { name: 'Indian Union Muslim League', acronym: 'IUML', manifesto: 'Muslim minority rights, constitutional secularism, UDF alliance, education and welfare for Muslims.', past_work: 'Muslim education institutions, partnership in Kerala welfare schemes, minority welfare boards.', controversies: 'Accused of religious politics, communal vote-bank tactics by critics.' },
  { name: 'Telugu Desam Party', acronym: 'TDP', manifesto: 'Andhra development, Amaravati capital, backward class welfare, NTR legacy, employment for youth.', past_work: 'NTR rice scheme, welfare pensions, AP bifurcation response, IT sector growth in Hyderabad.', controversies: 'Amaravati capital controversy, AP bifurcation bitterness, skill development scam allegations.' },
  { name: 'YSR Congress Party', acronym: 'YSRCP', manifesto: 'Navaratnalu welfare schemes, direct benefit transfers, Rythu Bharosa, housing for all in AP.', past_work: 'Amma Vodi, Jagananna Vidya Deevena, Rythu Bharosa, housing colonies, village secretariat system.', controversies: 'AP capital Amaravati stalling, disproportionate assets case against Jagan, sand mafia allegations.' },
  { name: 'Biju Janata Dal', acronym: 'BJD', manifesto: 'Odisha-centric development, BSKY health scheme, Kalia scheme for farmers, women empowerment.', past_work: 'BSKY health insurance, Mo Sarkar governance, Kalia farmer scheme, Odisha disaster management excellence.', controversies: 'Chit fund scam links, mining irregularities, corruption in rural schemes.' },
  { name: 'Jharkhand Mukti Morcha', acronym: 'JMM', manifesto: 'Tribal rights, forest rights, Jharkhand statehood legacy, Sarkari Naukri lokalization, Abua Awas Yojana.', past_work: 'Abua Awas housing, tribal land protection, Jharkhand statehood movement, Mukhyamantri Maiyan Samman Yojana.', controversies: 'Hemant Soren land scam (arrested 2024), mining lease controversy, corruption in MNREGA implementation.' },
  { name: 'Sikkim Krantikari Morcha', acronym: 'SKM', manifesto: 'Sikkim development, organic farming, youth employment, infrastructure, anti-incumbency.', past_work: '100% organic state achievement, rural connectivity, Sikkim welfare pension expansion.', controversies: 'Alleged political vendetta against SDF workers, delay in disaster relief 2023 floods.' },
  { name: 'Mizo National Front', acronym: 'MNF', manifesto: 'Mizoram development, Mizo cultural preservation, peace process, drug-free Mizoram.', past_work: 'Peace accord 1986, drug-free policy, Mizoram model of cleanliness, Tlawmngaihna principle governance.', controversies: 'Mizoram-Assam border violence 2021, criticism of Centre relations.' },
  { name: 'National People\'s Party', acronym: 'NPP', manifesto: 'Northeast development, tribal welfare, Meghalaya upliftment, infrastructure in hilly areas.', past_work: 'Meghalaya road development, tourism promotion, Shillong smart city project initiation.', controversies: 'Coal mining ban management, illegal mining controversy.' },
  { name: 'Zoram People\'s Movement', acronym: 'ZPM', manifesto: 'Anti-corruption, Mizoram development, clean governance, youth-first policies.', past_work: 'New government since 2023, transparency initiatives, flood relief 2024.', controversies: 'New party, limited track record so far.' },
];

const initializeDB = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS Parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      acronym TEXT NOT NULL,
      manifesto TEXT,
      past_work TEXT,
      controversies TEXT,
      vote_count INTEGER DEFAULT 0,
      logo_url TEXT,
  crimes INTEGER DEFAULT 0,
  controversies_count INTEGER DEFAULT 0,
  rupee_weakening INTEGER DEFAULT 0,
  rape_cases INTEGER DEFAULT 0,
  frauds INTEGER DEFAULT 0,
  court_cases INTEGER DEFAULT 0
    )`);
    // Alter table if it already exists
    db.run(`ALTER TABLE Parties ADD COLUMN logo_url TEXT`, (err) => {});

    db.run(`CREATE TABLE IF NOT EXISTS Locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT NOT NULL,
      district TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      party_id INTEGER,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      position TEXT NOT NULL,
      bio TEXT,
      wealth_estimation TEXT,
      past_work TEXT,
      photo_url TEXT,
  crimes INTEGER DEFAULT 0,
  controversies_count INTEGER DEFAULT 0,
  rupee_weakening INTEGER DEFAULT 0,
  rape_cases INTEGER DEFAULT 0,
  frauds INTEGER DEFAULT 0,
  court_cases INTEGER DEFAULT 0,
      FOREIGN KEY (party_id) REFERENCES Parties(id)
    )`);
    // Alter table if it already exists
    db.run(`ALTER TABLE Candidates ADD COLUMN photo_url TEXT`, (err) => {});

    db.run(`CREATE TABLE IF NOT EXISTS PartyVotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_id INTEGER,
      voter_token TEXT,
      voter_name TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (party_id) REFERENCES Parties(id)
    )`);
    // Alter table if it already exists to add voter_name
    db.run(`ALTER TABLE PartyVotes ADD COLUMN voter_name TEXT`, (err) => {});

    db.run(`CREATE TABLE IF NOT EXISTS CandidateVotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER,
      voter_token TEXT,
      voter_name TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES Candidates(id)
    )`);
    // Alter table if it already exists to add voter_name
    db.run(`ALTER TABLE CandidateVotes ADD COLUMN voter_name TEXT`, (err) => {});

    // Advanced RBAC Users Table
    db.run(`CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Inquiries Table (for business deals / projects)
    db.run(`CREATE TABLE IF NOT EXISTS Inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      contact_number TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Approval Requests Workflow
    db.run(`CREATE TABLE IF NOT EXISTS ApprovalRequests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT, -- 'ADD', 'UPDATE', 'DELETE'
      target_table TEXT, -- 'Candidates', 'Parties'
      target_id INTEGER, -- Null if action is ADD
      new_data TEXT, -- JSON string of the new data
      requested_by TEXT, -- username of office staff
      status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed default MAIN_ADMIN if users table is empty
    db.get('SELECT count(*) as count FROM Users', (err, row) => {
      if (!err && row.count === 0) {
        db.run("INSERT INTO Users (username, password, role) VALUES ('admin', 'VyxenAdmin@2025', 'MAIN_ADMIN')");
      }
    });

    db.get('SELECT COUNT(*) AS count FROM Parties', (err, row) => {
      if (!err && row.count === 0) {
        console.log('Inserting all Indian parties and states...');
        insertAllData();
      }
    });
  });
};

const insertAllData = () => {
  // Insert parties
  const pStmt = db.prepare('INSERT INTO Parties (name, acronym, manifesto, past_work, controversies) VALUES (?,?,?,?,?)');
  ALL_PARTIES.forEach(p => pStmt.run([p.name, p.acronym, p.manifesto, p.past_work, p.controversies]));
  pStmt.finalize();

  // Insert all states + districts
  const lStmt = db.prepare('INSERT INTO Locations (state, district) VALUES (?,?)');
  ALL_STATES.forEach(({ state, districts }) => {
    districts.forEach(district => lStmt.run([state, district]));
  });
  lStmt.finalize();

  // Insert default admin
  db.run("INSERT OR IGNORE INTO Admins (username, password) VALUES ('admin', 'VyxenAdmin@2025')");

  // Insert some sample candidates
  setTimeout(() => {
    db.all('SELECT id, acronym FROM Parties', (err, rows) => {
      if (err) return;
      const pm = {};
      rows.forEach(r => { pm[r.acronym] = r.id; });

      const candidates = [
        { name: 'Arun Govil', party: 'BJP', state: 'Uttar Pradesh', district: 'Meerut', position: 'MP', bio: 'Actor and social worker, known for Ramayan.', wealth: '₹5.5 Crore', past_work: 'Cultural heritage promotion, rural development.' },
        { name: 'Sunita Verma', party: 'SP', state: 'Uttar Pradesh', district: 'Meerut', position: 'MP', bio: 'Former Mayor with strong local connect.', wealth: '₹2.1 Crore', past_work: 'Civic infrastructure, women welfare.' },
        { name: 'Somendra Tomar', party: 'BJP', state: 'Uttar Pradesh', district: 'Meerut', position: 'MLA', bio: 'Youth leader focused on sports.', wealth: '₹3.4 Crore', past_work: 'Sports infrastructure upgrade.' },
        { name: 'Mala Rajya Laxmi Shah', party: 'BJP', state: 'Uttarakhand', district: 'Dehradun', position: 'MP', bio: 'Royal family member turned politician.', wealth: '₹45 Crore', past_work: 'Rural roads, Garhwal development.' },
        { name: 'Bansuri Swaraj', party: 'BJP', state: 'Delhi', district: 'New Delhi', position: 'MP', bio: 'Lawyer, daughter of Sushma Swaraj.', wealth: '₹11 Crore', past_work: 'Legal aid for the poor.' },
        { name: 'Somnath Bharti', party: 'AAP', state: 'Delhi', district: 'New Delhi', position: 'MP', bio: 'Lawyer and former Delhi minister.', wealth: '₹2.8 Crore', past_work: 'Smart parks, neighbourhood development.' },
        { name: 'Rahul Singh', party: 'INC', state: 'Bihar', district: 'Patna', position: 'MLA', bio: 'Grassroots leader, farmers advocate.', wealth: '₹1.5 Crore', past_work: 'Farmer welfare camps, water access.' },
        { name: 'Priya Sharma', party: 'BJP', state: 'Rajasthan', district: 'Jaipur', position: 'MLA', bio: 'Women empowerment activist turned politician.', wealth: '₹3.2 Crore', past_work: 'Self-help group promotion, rural schools.' },
        { name: 'Abdul Rehman', party: 'TMC', state: 'West Bengal', district: 'Murshidabad', position: 'MLA', bio: 'Community leader, minority rights advocate.', wealth: '₹1.1 Crore', past_work: 'Education access, local hospital improvement.' },
        { name: 'Kavitha Reddy', party: 'YSRCP', state: 'Andhra Pradesh', district: 'Guntur', position: 'MP', bio: 'Women rights activist and politician.', wealth: '₹6.7 Crore', past_work: 'Amma Vodi beneficiary tracking, Rythu Bharosa.' },
      ];

      const cStmt = db.prepare('INSERT INTO Candidates (name, party_id, state, district, position, bio, wealth_estimation, past_work) VALUES (?,?,?,?,?,?,?,?)');
      candidates.forEach(c => {
        const pid = pm[c.party] || null;
        cStmt.run([c.name, pid, c.state, c.district, c.position, c.bio, c.wealth, c.past_work]);
      });
      cStmt.finalize();
      console.log('All data inserted successfully.');
    });
  }, 500);
};

module.exports = { db, initializeDB };
