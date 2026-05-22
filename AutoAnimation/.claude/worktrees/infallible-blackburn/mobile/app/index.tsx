import React, { useRef, useState, useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator, Platform, SafeAreaView, StatusBar, BackHandler } from 'react-native'
import { WebView } from 'react-native-webview'
import Constants from 'expo-constants'

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0]
const DEV_URL = `http://${expoHost ?? '192.168.4.26'}:5173`
const PROD_URL = process.env.EXPO_PUBLIC_WEB_URL || DEV_URL
const WEB_APP_URL = __DEV__ ? DEV_URL : PROD_URL

export default function App() {
  const webViewRef = useRef<WebView>(null)
  const [loading, setLoading] = useState(true)
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'android') return
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack()
        return true
      }
      return false
    })
    return () => handler.remove()
  }, [canGoBack])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        containerStyle={{ backgroundColor: '#09090b' }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowFileAccess
        domStorageEnabled
        javaScriptEnabled
        pullToRefreshEnabled
        bounces={false}
        scalesPageToFit={false}
        injectedJavaScript={`
          (function() {
            var meta = document.querySelector('meta[name="viewport"]');
            if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
            meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
            window.__PROANIMATE_NATIVE__ = true;
          })();
          true;
        `}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  webview: { flex: 1, backgroundColor: '#09090b' },
  loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090b', zIndex: 10 },
})
