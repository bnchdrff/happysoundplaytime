var sampleRate = 44100;

function applyEnvelope(data, a, d, s, r) {
  var n = data.length;
  a *= n;
  d *= n;
  r *= n;
  var is = 1 - s;
  for (var i = 0; i < a; ++i) {
    data[i] *= i / a;
  }
  for (; i < (a + d); ++i) {
    data[i] *= (1 - (i - a) / d) * is + s;
  }
  for (; i < (n - r); ++i) {
    data[i] *= s;
  }
  for (var j = i; i < n; ++i) {
    data[i] *= s * (1 - (i - j) / r);
  }
}

function getFreqSweep(data, length, freq1, freq2) {
  var d1 = Math.PI * 2 * freq1 / sampleRate,
    d2 = Math.PI * 2 * freq2 / sampleRate,
    dd = (d2 - d1) / length,
    dt = d1,
    t = 0;
  for (var i = 0; i < length; ++i) {
    data[i] = Math.sin(t);
    t += dt;
    dt += dd;
  }
}

function encodeAudio8bit(data) {
  var n = data.length, i;

  // 8-bit mono WAVE header template
  var header = "RIFF<##>WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00<##><##>\x01\x00\x08\x00data<##>";

  // Helper to insert a 32-bit little endian int.
  function insertLong(value) {
    var bytes = "";
    for (i = 0; i < 4; ++i) {
        bytes += String.fromCharCode(value % 256);
        value = Math.floor(value / 256);
    }
    header = header.replace('<##>', bytes);
  }

  // ChunkSize
  insertLong(36 + n);

  // SampleRate
  insertLong(sampleRate);

  // ByteRate
  insertLong(sampleRate);

  // Subchunk2Size
  insertLong(n);

  // Output sound data
  for (var i = 0; i < n; ++i) {
    header += String.fromCharCode(Math.round(Math.min(1, Math.max(-1, data[i])) * 127 + 127));
  }

  return 'data:audio/wav;base64,' + btoa(header);
}

function applySinDistort(data, drive) {
  var n = data.length;
  var s = Math.PI * drive / 2;
  for (var i = 0; i < n; ++i) {
    data[i] = Math.sin(data[i] * s);
  }
}

$(document).ready(function() {

// create start sounds
var data = [];
getFreqSweep(data, 10000, $('#el1start').val(), $('#el1end').val());
applySinDistort(data, 1);
$('<audio />').attr({id: 'el1', src: encodeAudio8bit(data)}).appendTo('#sounds');
getFreqSweep(data, 5000, $('#el2start').val(), $('#el2end').val());
$('<audio />').attr({id: 'el2', src: encodeAudio8bit(data)}).appendTo('#sounds');

// loop em
$('#el1').on('ended', function() { this.pause(); this.currentTime = 0; $('#el2')[0].play(); });
$('#el2').on('ended', function() { this.pause(); this.currentTime = 0; $('#el1')[0].play(); });

$('#modifysounds').click(function() {
  var el1start = $('#el1start').val();
  var el1end = $('#el1end').val();
  var el2start = $('#el2start').val();
  var el2end = $('#el2end').val();
  replaceSound('el1', el1start, el1end);
  replaceSound('el2', el2start, el2end);
});

function replaceSound(id, startFreq, endFreq) {
  var data = [];
  getFreqSweep(data, 20000, startFreq, endFreq);
  applySinDistort(data, 5);
  $('#' + id)[0].pause();
  $('#' + id).detach().attr({src: encodeAudio8bit(data)}).appendTo('#sounds');
  $('#' + id)[0].play();
}

});
