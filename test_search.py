with open('KNSDC-Participant.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = '$' + '(' + 'b.id' + ')'
if target in text:
    print('Found  in file!')
else:
    print(' NOT in file')
