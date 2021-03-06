
export default class User {
    get isEmailVerified() {
        return this._isEmailVerified;
    }

    set isEmailVerified(value) {
        this._isEmailVerified = value;
    }


    get icon() {
        return this._icon;
    }

    set icon(value) {
        this._icon = value;
    }
    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    get userJson() {
        return this._userJson;
    }

    set userJson(value) {
        this._userJson = value;
    }

    get username() {
        return this._username;
    }

    set username(value) {
        this._username = value;
    }

    get firstName() {
        return this._firstName;
    }

    set firstName(value) {
        this._firstName = value;
    }

    get lastName() {
        return this._lastName;
    }

    set lastName(value) {
        this._lastName = value;
    }

    get gender() {
        return this._gender;
    }

    set gender(value) {
        this._gender = value;
    }

    get email() {
        return this._email;
    }

    set email(value) {
        this._email = value;
    }

    get headLine() {
        return this._headLine;
    }

    set headLine(value) {
        this._headLine = value;
    }

    get phone() {
        return this._phone;
    }

    set phone(value) {
        this._phone = value;
    }

    get website() {
        return this._website;
    }

    set website(value) {
        this._website = value;
    }

    get github() {
        return this._github;
    }

    set github(value) {
        this._github = value;
    }

    get linkedin() {
        return this._linkedin;
    }

    set linkedin(value) {
        this._linkedin = value;
    }

    get country() {
        return this._country;
    }

    set country(value) {
        this._country = value;
    }

    get city() {
        return this._city;
    }

    set city(value) {
        this._city = value;
    }

    /**
     *
     * @return {Date}
     */
    get birthday() {
        return this._birthday;
    }

    set birthday(value) {
        this._birthday = value;
    }

    get about() {
        return this._about;
    }

    set about(value) {
        this._about = value;
    }

    /**
     *
     * @return {{title:string,list:string[],icon:string}[]}
     */
    get skills() {
        return this._skills;
    }

    set skills(value) {
        this._skills = value;
    }

    /**
     *
     * @return {{
     * title:	string,
     * company:	string,
     * startDate:Date,
     * endDate:Date,
     * atThisRole:boolean,
     * description:string
     * }[]}
     */
    get experiences() {
        return this._experiences;
    }

    set experiences(value) {
        this._experiences = value;
    }

    /**
     *
     * @return {{
    school: string,
    degree: string,
    field: string,
    startDate: Date,
    endDate: Date,
    description: string
    }[]}
     */
    get educations() {
        return this._educations;
    }

    set educations(value) {
        this._educations = value;
    }

    /**
     *
     * @return {{
    name: string,
    issuingOrganization: string,
    issueDate: Date,
    credentialID: Date,
    credentialUrl: string
    }[]}
     */
    get licenses() {
        return this._licenses;
    }

    set licenses(value) {
        this._licenses = value;
    }

    get languages() {
        return this._languages.map((language) => {
            return this.capitalizeFirstLetter(language)
        });
    }

    set highlights(value) {
        this._highlights = value;
    }

    get highlights() {
        return this._highlights
    }

    set languages(value) {
        this._languages = value;
    }

    get avatar() {
        return this._avatar;
    }

    set avatar(value) {
        this._avatar = value;
    }

    /**
     *
     * @return {{
     * color:string,
     * template:string,
     * templateSettings:Object,
     * modules : string[]
     * }}
     */
    get settings() {
        return this._settings;
    }

    set settings(value) {
        this._settings = value;
    }


    /**
     * @param _id
     * @param username
     * @param firstName
     * @param lastName
     * @param gender
     * @param email
     * @param isEmailVerified
     * @param headLine
     * @param icon
     * @param phone
     * @param website
     * @param github
     * @param linkedin
     * @param country
     * @param city
     * @param birthday
     * @param about
     * @param {[Object]} skills
     * @param {Object[]} experiences
     * @param {[Object]} educations
     * @param {[Object]} licenses
     * @param {[String]} languages
     * @param {[String]} highlights
     * @param {Object} settings
     * @param avatar
     *
     */
    constructor({
                    _id,
                    username,
                    firstName,
                    lastName,
                    gender,
                    email,
                    isEmailVerified,
                    headLine,
                    icon,
                    phone,
                    website,
                    github,
                    linkedin,
                    country,
                    city,
                    birthday,
                    about,
                    skills,
                    experiences,
                    educations,
                    licenses,
                    languages,
                    highlights,
                    settings,
                    avatar
                }) {
        this._id = _id
        this._username = username
        this._firstName = firstName
        this._lastName = lastName
        this._gender = gender
        this._email = email
        this._isEmailVerified = isEmailVerified;
        this._headLine = headLine
        this._icon = icon
        this._phone = phone
        this._website = website
        this._github = github
        this._linkedin = linkedin
        this._country = country
        this._city = city
        this._birthday = birthday
        this._about = about
        this._skills = skills
        this._experiences = experiences
        this._educations = educations
        this._licenses = licenses
        this._languages = languages
        this._highlights = highlights
        this._avatar = avatar
        this._settings = settings

        if (this._settings.templateSettings === undefined){
            this._settings.templateSettings = {c1:["basic", "contact","skills","languages"],c2:["about","highlights","experiences","educations","licenses"]}
        }

    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}