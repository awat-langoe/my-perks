if [[ ! -z "$FIREBASE_OPTIONS" ]]; then
  echo $FIREBASE_OPTIONS > src/app/firebase/firebase-options.ts
else
  echo "FIREBASE_OPTIONS is empty"
fi
