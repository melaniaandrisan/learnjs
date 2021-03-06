'use strict';

var learnjs = {
    poolId:'us-east-1:7b444dd5-ceaf-4d75-b403-9e5da0ebc20b"'
};

learnjs.profileView = function(){
    var view = learnjs.template('profile-view');
    learnjs.identity.done(function(identity){
        view.find('.email').text(identity.email);
    });

    return view;
}

learnjs.addProfileLink = function(profile){
    var link = learnjs.template('profile-link');
    link.find('a').text(profile.email);
    $('.singin-bar').prepend(link);
}

learnjs.identity = new $.Deferred();

function googleSignIn(googleUser) {
    var id_tocken = googleUser.getAuthResponse().id_tocken;
    AWS.config.update({
        region: 'us-east-1',
        credentials: new AWS.CognitoIdentityCredentials({
            IdentitypoolId: learnjs.poolId,
            Logins: {
                'accounts.google.com': id_tocken
            }
        })
    })

    learnjs.awsRefresh().then(function(id){
        learnjs.identity.resolve({
            id:id,
            email: googleUser.getBasicProfile().getEmail(),
            refresh: refresh
        })
    })
}

function refresh (){
    return gapi.auth2.getAuthInstance().signIn({
        prompt: 'login'
    }).then(function(userUpdate){
        var creds = AWS.config.credentials;
        var newToken = userUpdate.getAuthResponse().id_tocken;
        creds.params.logins['accounts.google.com']=newToken;
        return learnjs.awsRefresh(); 
    })
}

learnjs.awsRefresh = function(){
    var deferred = new $.Deferred();
    AWS.config.credentials.refresh(function(err){
        if(err){
            deferred.reject(err);
        }else{
            deferred.resolve(AWS.config.credentials.identityId);
        }
    })
    return deferred.promise();
}

learnjs.problems = [
    {
        description: "What is truth?",
        code: "function problem() {return __ ;}"
    },
    {
        description: "What is truth again?",
        code: "function problem() {return __ ;}"
    }
];

learnjs.triggerEvent = function (name, args) {
    $('.view-container>*').trigger(name, args);
}



learnjs.applyObject = function (obj, elem) {
    for (var key in obj) {
        elem.find('[data-name="' + key + '"]').text(obj[key]);
    }
};

learnjs.template = function (name) {
    return $('.templates .' + name).clone();
}

learnjs.flashElement = function (elem, content) {
    elem.fadeOut('fast', function () {
        elem.html(content);
        elem.fadeIn();
    });
};

learnjs.buildCorrectFlash = function (problemNum) {
    var correctFlash = learnjs.template('correct-flash');
    var link = correctFlash.find('a');
    if (problemNum < learnjs.problems.length) {
        link.attr('href', '#problem-' + (problemNum + 1));
    } else {
        link.attr('href', '');
        link.text("You're Finished!");
    }
    return correctFlash;
}
learnjs.problemView = function (data) {

    var problemNumber = parseInt(data, 10);

    var view = $('.templates .problem-view').clone();

    var problemData = learnjs.problems[problemNumber - 1];

    var resultFlash = view.find('.result');

    function checkAnswer() {
        var answer = view.find('.answer').val();

        var test = problemData.code.replace('__', answer) + '; problem();';

        return eval(test);
    }

    function checkAnswerClick() {
        if (checkAnswer()) {
            var correctFlash = learnjs.buildCorrectFlash(problemNumber);
            learnjs.flashElement(resultFlash, correctFlash);
        } else {
            learnjs.flashElement(resultFlash, 'Incorrect!');
        }
        return false;
    }

    view.find('.check-btn').click(checkAnswerClick);

    view.find('.title').text('Problem #' + problemNumber);

    learnjs.applyObject(learnjs.problems[problemNumber - 1], view);

    //Add skip button to nav bar
    if (problemNumber < learnjs.problems.length) {
        var buttonItem = learnjs.template('skip-btn');
        buttonItem.find('a').attr('href', '#problem-' + (problemNumber + 1));
        $('.nav-list').append(buttonItem);
        view.bind('removingView', function () {
            buttonItem.remove();
        });
    }

    return view;
}

learnjs.landingPage = function () {
    return learnjs.template('landing-view');
}
learnjs.showView = function (hash) {
    var routes = {
        '#problem': learnjs.problemView,
        '#profile':learnjs.profileView,
        '': learnjs.landingPage,
        '#': learnjs.landingPage
    };
    var hashParams = hash.split('-');
    var viewFn = routes[hashParams[0]];
    if (viewFn) {

        learnjs.triggerEvent('removingView', []);
        $('.view-container').empty().append(viewFn(hashParams[1]));

        //$('.view-container').html(viewFn(hashParams[1]));
        //$('.view-container').empty();
        //$(viewFn(hashParams[1])).appendTo('.view-container');
    }
}

learnjs.appOnReady = function () {
    window.onhashchange = function () {
        learnjs.showView(window.location.hash);
    }
    learnjs.showView(window.location.hash);
    learnjs.identity.done(learnjs.addProfileLink);
}